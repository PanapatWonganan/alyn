# 🎭 Alyn Character Chat — AI Roleplay Feature Plan

> แผนพัฒนาฟีเจอร์ AI Character Chat สำหรับ Alyn (อลิน)
> **Scope:** SFW / suggestive only (Option 4) — romantic, flirty, emotional depth แต่ไม่มี explicit content
> Last updated: 2026-04-11

---

## 🎯 1. เป้าหมายและขอบเขต

### 1.1 Positioning
- **Feature ใน Alyn เดียว** — ไม่ใช่ subdomain แยก ไม่ใช่ brand ใหม่
- ผูกกับ ecosystem นิยายที่มีอยู่ — character สามารถ link กลับไปยัง novel ได้
- ใช้ **coin balance เดิม** — ไม่สร้างระบบเงินใหม่
- Reuse auth, notification, report, age gate ทั้งหมด

### 1.2 ฟีเจอร์ที่ทำใน Phase 1 (MVP)
- สร้าง character (name, avatar, persona, greeting, tagline, tags)
- Chat 1-on-1 แบบ streaming (SSE)
- Chat history persist ต่อ session
- Discovery page (grid + search + filter)
- Coin-based message credits + daily free tier
- Creator attribution กลับไปโปรไฟล์นักเขียน
- Report + admin moderation
- Character → Novel optional link

### 1.3 ฟีเจอร์ที่ **ไม่ทำ** ใน Phase 1
- Explicit NSFW — ใช้ Claude + fade-to-black policy
- Voice reply / TTS
- Image generation
- Group chat / multi-character
- Long-term memory (beyond session)
- Scenario templates
- Writer export tool (→ Phase 3)
- Character fine-tuning / training

### 1.4 สิ่งที่ **โมเดลจะปฏิเสธ** (ยอมรับตั้งแต่ต้น)
Claude จะปฏิเสธหรือ fade-to-black เนื้อหาต่อไปนี้ — นี่คือ *ฟีเจอร์* ไม่ใช่ bug:
- Explicit sexual content
- Graphic violence/gore
- Self-harm instructions
- Minors + romantic/sexual
- CSAM
- Real-person impersonation in sexual context

**Marketing copy** ต้อง frame ชัดเจน: "เล่าเรื่องโรแมนซ์ ดราม่า ผจญภัย" ไม่ใช่ "แชท 18+"

---

## 🏗️ 2. Tech Stack

| ด้าน | เลือกใช้ | เหตุผล |
|---|---|---|
| **LLM** | **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) | ภาษาไทยระดับ production, ราคา/คุณภาพสมดุล, safety built-in |
| **SDK** | `@anthropic-ai/sdk` | Official, streaming support |
| **Streaming** | Server-Sent Events ผ่าน Next.js `ReadableStream` | Built-in App Router support |
| **DB** | Prisma 7 + PostgreSQL (เดิม) | ใช้ stack ที่มีอยู่ |
| **Auth** | NextAuth 5 (เดิม) | reuse `requireAuth()` |
| **Rate limit** | `src/lib/rate-limit.ts` (เดิม) | เพิ่ม scope ใหม่ |
| **Payment** | Coin balance + CoinTransaction (เดิม) | เพิ่ม type `CHAT_MESSAGE` |

### 2.1 Environment variables ที่ต้องเพิ่ม
```bash
# .env
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-haiku-4-5-20251001"  # override ได้เมื่ออยากลอง Sonnet
CHAT_FREE_MESSAGES_PER_DAY="20"              # free tier per user per day
CHAT_COIN_COST_PER_MESSAGE="1"               # 1 coin = N messages (default 1 coin / 10 msg = 0.1)
CHAT_MAX_CONTEXT_MESSAGES="20"               # last N messages sent as context
CHAT_MAX_OUTPUT_TOKENS="400"                 # hard cap per reply
```

**Mock mode:** ถ้า `ANTHROPIC_API_KEY` ไม่ตั้ง → reply ด้วย canned message `[CHAT MOCK] ...` เหมือนที่ email/omise ทำ (ดู `src/lib/email.ts`, `src/lib/payment/omise.ts`)

---

## 💰 3. Economics

### 3.1 Cost per message (Haiku 4.5)
- Input: 500 tokens (system prompt + persona + last 20 messages) @ $1/1M = $0.0005
- Output: 200 tokens @ $5/1M = $0.0010
- **รวม ~$0.0015/msg ≈ 0.055 บาท**

### 3.2 Free tier
- **20 messages/วัน/user** — ไม่ต้องเติมก่อน ลองเล่นได้
- ต้นทุน max: 20 × 0.055 = **1.10 บาท/user/วัน**
- acceptable loss leader เพราะ character chat มี retention สูง

### 3.3 Paid tier
- **1 coin (1 บาท) = 10 messages**
- ต้นทุน 10 messages = 0.55 บาท → **margin ~45%**
- ถ้าจะ preserve margin 50% ต่อไป ตอน Sonnet → ปรับเป็น 1 coin = 5 msg

### 3.4 Guardrails
- Monthly spending cap ที่ Anthropic Console (แนะนำ $200/เดือน phase 1)
- Per-user hard limit 100 msg/ชม. (rate limit)
- Per-user daily cap 500 msg/วัน (กัน runaway หลังเติมเหรียญ)
- Auto-disable feature ถ้า Anthropic budget เหลือ < 10% (cron check)

---

## 🗄️ 4. Database Schema

เพิ่ม models ต่อไปนี้ใน `prisma/schema.prisma`:

```prisma
model Character {
  id            String   @id @default(cuid())
  slug          String   @unique
  name          String
  avatar        String?
  tagline       String                            // "นักสืบสาวจากเชียงใหม่"
  persona       String   @db.Text                 // character traits / system prompt body
  greeting      String   @db.Text                 // first message shown in chat
  scenario      String?  @db.Text                 // optional setting/context
  exampleDialog String?  @db.Text                 // few-shot examples (optional)

  visibility    String   @default("PUBLIC")       // PUBLIC | UNLISTED | PRIVATE
  isAdult       Boolean  @default(false)          // suggestive/mature themes — still SFW
  isFeatured    Boolean  @default(false)
  chatCount     Int      @default(0)              // denormalized — # of sessions created
  messageCount  Int      @default(0)              // denormalized — total messages sent
  favoriteCount Int      @default(0)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  creatorId String
  creator   User   @relation("UserCharacters", fields: [creatorId], references: [id], onDelete: Cascade)

  novelId String?
  novel   Novel?  @relation("NovelCharacters", fields: [novelId], references: [id], onDelete: SetNull)

  tags         CharacterTag[]
  chatSessions ChatSession[]
  favorites    CharacterFavorite[]

  @@index([creatorId])
  @@index([novelId])
  @@index([visibility, isAdult])
  @@index([chatCount])
  @@map("characters")
}

model CharacterTag {
  characterId String
  tag         String
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)

  @@id([characterId, tag])
  @@index([tag])
  @@map("character_tags")
}

model CharacterFavorite {
  userId      String
  characterId String
  createdAt   DateTime @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  character Character @relation(fields: [characterId], references: [id], onDelete: Cascade)

  @@id([userId, characterId])
  @@map("character_favorites")
}

model ChatSession {
  id          String   @id @default(cuid())
  userId      String
  characterId String
  title       String?                             // auto-generated from first user message
  lastMessageAt DateTime @default(now())
  createdAt   DateTime @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  character Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  messages  ChatMessage[]

  @@index([userId, lastMessageAt])
  @@index([characterId])
  @@map("chat_sessions")
}

model ChatMessage {
  id        String   @id @default(cuid())
  sessionId String
  role      String                                 // "user" | "assistant" | "system"
  content   String   @db.Text
  tokensIn  Int      @default(0)                   // only set on assistant messages
  tokensOut Int      @default(0)                   // only set on assistant messages
  stopReason String?                               // end_turn | max_tokens | refusal | error
  createdAt DateTime @default(now())

  session ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, createdAt])
  @@map("chat_messages")
}

// Track daily free tier usage without bloating the main wallet
model ChatDailyUsage {
  userId    String
  date      String                                 // YYYY-MM-DD (Asia/Bangkok)
  freeUsed  Int      @default(0)
  paidUsed  Int      @default(0)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, date])
  @@map("chat_daily_usage")
}
```

### 4.1 เพิ่ม relations ใน model ที่มีอยู่
```prisma
model User {
  // ... existing fields
  characters       Character[]         @relation("UserCharacters")
  characterFavorites CharacterFavorite[]
  chatSessions     ChatSession[]
  chatDailyUsage   ChatDailyUsage[]
}

model Novel {
  // ... existing fields
  characters Character[] @relation("NovelCharacters")
}
```

### 4.2 Enum ที่ต้องเพิ่ม (string-stored เหมือน pattern เดิม)

- **TransactionType** ใหม่: `CHAT_MESSAGE` — เพิ่มใน CLAUDE.md comments
- **ReportTargetType** ใหม่: `CHARACTER` — เพิ่มเพื่อให้ report flow reuse ได้

---

## 🛣️ 5. API Routes

### 5.1 Character CRUD

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/characters` | optional | List (filter: tag, search, sort, adult, novelId) |
| `POST` | `/api/characters` | required | Create (writer only? — yes, to prevent spam) |
| `GET` | `/api/characters/[id]` | optional | Detail |
| `PATCH` | `/api/characters/[id]` | owner | Update |
| `DELETE` | `/api/characters/[id]` | owner+admin | Delete |
| `POST` | `/api/characters/[id]/favorite` | required | Toggle favorite |

### 5.2 Chat

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/chat/sessions` | required | Create session (body: `{ characterId }`) |
| `GET` | `/api/chat/sessions` | required | List user's sessions |
| `GET` | `/api/chat/sessions/[id]` | owner | Session + messages |
| `DELETE` | `/api/chat/sessions/[id]` | owner | Delete session |
| `POST` | `/api/chat/sessions/[id]/message` | owner | **Streaming SSE** — send message, stream reply |
| `GET` | `/api/chat/usage` | required | Today's free/paid counts + remaining |

### 5.3 Admin

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/characters` | admin | All characters incl. private + reported |
| `PATCH` | `/api/admin/characters/[id]` | admin | Feature/unfeature, set visibility, ban |
| `GET` | `/api/admin/chat-stats` | admin | Token usage, cost estimate, active users |

---

## 🔑 6. Core Logic — Send Message Flow

จุดที่ซับซ้อนที่สุด — ต้องทำให้ถูกทั้ง **transaction safety**, **streaming**, และ **billing**

### 6.1 Pseudo-code

```ts
// POST /api/chat/sessions/[id]/message
async function POST(req, { params }) {
  const session = await requireAuth();
  const { content } = await req.json();

  // 1. Rate limit
  const rl = rateLimitRequest(req, `chat:send:${session.user.id}`, 100, 3_600_000);
  if (!rl.success) return apiError("พิมพ์เร็วเกินไป", 429);

  // 2. Load session + character + recent messages (atomic read)
  const chatSession = await db.chatSession.findUnique({
    where: { id: params.id, userId: session.user.id },
    include: {
      character: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: Number(process.env.CHAT_MAX_CONTEXT_MESSAGES ?? 20),
      },
    },
  });
  if (!chatSession) return apiError("ไม่พบการสนทนา", 404);

  // 3. Check billing — either free tier OR coin deduction
  const billing = await debitForMessage(session.user.id);
  if (!billing.ok) return apiError(billing.error, 402);

  // 4. Persist user message immediately
  const userMsg = await db.chatMessage.create({
    data: { sessionId: chatSession.id, role: "user", content: sanitizeInput(content) },
  });

  // 5. Build prompt
  const systemPrompt = buildSystemPrompt(chatSession.character);
  const history = chatSession.messages
    .reverse()
    .map(m => ({ role: m.role, content: m.content }));

  // 6. Stream from Anthropic
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      let usageIn = 0;
      let usageOut = 0;
      let stopReason = "end_turn";

      try {
        const llmStream = anthropic.messages.stream({
          model: process.env.ANTHROPIC_MODEL!,
          max_tokens: Number(process.env.CHAT_MAX_OUTPUT_TOKENS ?? 400),
          system: systemPrompt,
          messages: [...history, { role: "user", content }],
        });

        for await (const evt of llmStream) {
          if (evt.type === "content_block_delta" && evt.delta.type === "text_delta") {
            full += evt.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: evt.delta.text })}\n\n`));
          }
        }

        const final = await llmStream.finalMessage();
        usageIn = final.usage.input_tokens;
        usageOut = final.usage.output_tokens;
        stopReason = final.stop_reason ?? "end_turn";

        // 7. Persist assistant reply
        await db.chatMessage.create({
          data: {
            sessionId: chatSession.id,
            role: "assistant",
            content: full,
            tokensIn: usageIn,
            tokensOut: usageOut,
            stopReason,
          },
        });

        // 8. Bump session + character counters
        await db.$transaction([
          db.chatSession.update({
            where: { id: chatSession.id },
            data: { lastMessageAt: new Date() },
          }),
          db.character.update({
            where: { id: chatSession.character.id },
            data: { messageCount: { increment: 1 } },
          }),
        ]);

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, stopReason })}\n\n`));
      } catch (err) {
        // Rollback billing on hard failure
        await refundMessage(session.user.id, billing);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "LLM_ERROR" })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
```

### 6.2 `debitForMessage` — ธุรกรรมเงิน (atomic)
ต้อง use `db.$transaction` เหมือน chapter purchase:

```ts
async function debitForMessage(userId: string) {
  const today = bangkokDate();                     // "YYYY-MM-DD"
  const freeCap = Number(process.env.CHAT_FREE_MESSAGES_PER_DAY ?? 20);
  const coinCost = 1;                              // deduct 1 coin per 10 messages: handled via fractional counter

  return db.$transaction(async (tx) => {
    const usage = await tx.chatDailyUsage.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, freeUsed: 0, paidUsed: 0 },
      update: {},
    });

    // Use free slot first
    if (usage.freeUsed < freeCap) {
      await tx.chatDailyUsage.update({
        where: { userId_date: { userId, date: today } },
        data: { freeUsed: { increment: 1 } },
      });
      return { ok: true as const, source: "free" as const };
    }

    // Deduct 1 coin every 10 paid messages (paidUsed % 10 === 0 triggers debit)
    if (usage.paidUsed % 10 === 0) {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { coinBalance: true } });
      if (!user || user.coinBalance < 1) {
        return { ok: false as const, error: "เหรียญไม่พอ เติมเหรียญเพื่อคุยต่อ" };
      }
      await tx.user.update({
        where: { id: userId },
        data: { coinBalance: { decrement: 1 } },
      });
      await tx.coinTransaction.create({
        data: {
          userId,
          type: "CHAT_MESSAGE",
          amount: -1,
          description: "ค่าข้อความแชท 10 ข้อความ",
        },
      });
    }

    await tx.chatDailyUsage.update({
      where: { userId_date: { userId, date: today } },
      data: { paidUsed: { increment: 1 } },
    });

    return { ok: true as const, source: "paid" as const };
  });
}
```

### 6.3 `buildSystemPrompt` — ตัวกำหนดคุณภาพ roleplay

```ts
function buildSystemPrompt(character: Character) {
  return `คุณกำลังสวมบทบาทเป็นตัวละครชื่อ "${character.name}"

คำแนะนำสั้นๆ เกี่ยวกับตัวละคร:
${character.tagline}

บุคลิกและภูมิหลัง:
${character.persona}

${character.scenario ? `ฉากสถานการณ์ปัจจุบัน:\n${character.scenario}\n` : ""}
${character.exampleDialog ? `ตัวอย่างการพูดของตัวละคร:\n${character.exampleDialog}\n` : ""}

กฎการสวมบทบาท:
1. ตอบเป็นภาษาไทยเสมอ ใช้โทนที่เข้ากับบุคลิกตัวละคร
2. คงบทบาทไว้เสมอ ห้ามหลุดว่าเป็น AI ถ้าผู้ใช้ถามก็เลี่ยงแบบในบท
3. ใช้ *คำอธิบายการกระทำ/อารมณ์* คั่นระหว่างบทพูด เช่น *ยิ้มมุมปาก* *หลบสายตา*
4. ตอบกระชับ 2-4 ประโยค ยกเว้นผู้ใช้ขอยาว
5. อย่าพูดแทนผู้ใช้ ให้ผู้ใช้เป็นคนเลือกการกระทำเอง
6. ถ้าผู้ใช้ขอสิ่งที่ขัดกับบุคลิกตัวละคร ให้ปฏิเสธแบบในบท
7. เนื้อหาโรแมนซ์ทำได้ แต่ให้ fade-to-black ก่อนฉากที่เปิดเผยมากเกินไป — เน้น emotional depth มากกว่า physical description
8. ห้ามสร้างเนื้อหาที่เกี่ยวกับผู้เยาว์ในบริบทโรแมนซ์/ทางเพศโดยเด็ดขาด`;
}
```

---

## 🖼️ 7. Frontend Routes

| Path | Purpose | Auth |
|---|---|---|
| `/characters` | Discovery homepage (grid + filter + search) | - |
| `/characters/create` | Create form (TipTap for persona?) | required |
| `/characters/[slug]` | Character profile + "เริ่มแชท" CTA | - |
| `/characters/[slug]/edit` | Edit form | owner |
| `/characters/[slug]/chat/[sessionId]` | Chat UI (full screen) | required |
| `/my/characters` | ตัวละครที่ฉันสร้าง | required |
| `/my/chats` | รายการ session ทั้งหมด | required |
| `/admin/characters` | Moderation | admin |

### 7.1 Navbar integration
เพิ่ม nav link ระหว่าง "อันดับ" กับ "ชั้นหนังสือ":
```ts
{ href: "/characters", label: "พูดคุย", icon: MessageCircle }
```
อัปเดต `src/components/layout/Navbar.tsx:269-275` `navLinks` array

### 7.2 Components ที่ต้องสร้าง
- `src/components/characters/CharacterCard.tsx` — ใช้ pattern เดียวกับ NovelCard (cover + tagline + chat count + creator)
- `src/components/characters/CharacterForm.tsx` — ฟอร์มสร้าง/แก้ไข (reuse RichTextEditor สำหรับ persona)
- `src/components/chat/ChatMessage.tsx` — bubble component (user vs assistant)
- `src/components/chat/ChatInput.tsx` — textarea + send button + coin counter
- `src/components/chat/ChatStream.tsx` — consumes SSE, renders streaming text word by word
- `src/components/chat/ChatHeader.tsx` — back + character avatar + menu

### 7.3 UX details ที่ลืมไม่ได้
- **Empty state ใน chat:** โชว์ `greeting` ของ character เป็น assistant message แรกเสมอ
- **Loading state:** typing indicator (3 จุดเด้ง) ตอน streaming ยังไม่เริ่มส่ง delta แรก
- **Error recovery:** ถ้า stream fail กลางทาง → โชว์ retry button, message ที่ user ส่งไม่หาย
- **Coin warning:** ใต้ input โชว์ `เหลือฟรี 14/20 วันนี้` หรือ `เหรียญ: 12 🪙 (120 ข้อความ)`
- **Age gate:** ถ้า `character.isAdult` → reuse `AgeGateModal` (30-day localStorage)
- **Copy message:** กด long-press/right-click ก็อปข้อความได้
- **Delete session:** confirm modal

---

## 🛡️ 8. Safety & Moderation

### 8.1 Hard rules (reject at API level, ก่อนส่งให้ Claude)
- Character ที่มีอายุระบุ < 18 → **block create + block chat**
- Character ที่ชื่อตรงกับบุคคลสาธารณะจริง (มี list เล็กๆ ของ celeb ไทย) → **manual review queue**
- User input > 2000 chars → truncate + warning
- User input ที่มี common prompt injection patterns (`"ignore previous"`, `"system:"`, `"you are now"`) → sanitize + log

### 8.2 Soft rules (ให้ Claude จัดการ)
- Claude refuse → persist message ด้วย `stopReason: "refusal"`, โชว์ UI neutral error "ตัวละครไม่สะดวกตอบเรื่องนี้"
- User ได้ refund message นั้น (ไม่หัก free/paid counter)

### 8.3 Report flow
- ปุ่ม report บน character profile + chat header
- `POST /api/reports` ที่มี `targetType: "CHARACTER"` (เพิ่ม enum)
- Admin queue ที่ `/admin/reports` (มีอยู่แล้ว — เพิ่ม support CHARACTER target)

### 8.4 Admin actions
- Unpublish character (set `visibility = "PRIVATE"`)
- Delete character (cascades sessions)
- Ban user from chat (add `chatBannedUntil` field ที่ User — phase 2)
- View session content (with logging of admin access)

### 8.5 Observability
- Log ทุก `stopReason: "refusal"` → dashboard ให้เห็น pattern
- Log token usage ต่อ user ต่อวัน
- Alert ถ้า daily LLM spend > budget threshold (cron check)

---

## 📁 9. File Structure

```
src/
├── app/
│   ├── (main)/
│   │   ├── characters/
│   │   │   ├── page.tsx                      # discovery
│   │   │   ├── create/page.tsx
│   │   │   ├── [slug]/
│   │   │   │   ├── page.tsx                  # profile
│   │   │   │   ├── edit/page.tsx
│   │   │   │   └── chat/[sessionId]/page.tsx # chat UI
│   │   ├── my/
│   │   │   ├── characters/page.tsx
│   │   │   └── chats/page.tsx
│   ├── api/
│   │   ├── characters/
│   │   │   ├── route.ts                       # GET list, POST create
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts                   # GET/PATCH/DELETE
│   │   │   │   └── favorite/route.ts
│   │   ├── chat/
│   │   │   ├── sessions/
│   │   │   │   ├── route.ts                   # GET/POST
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts               # GET/DELETE
│   │   │   │       └── message/route.ts       # POST (SSE)
│   │   │   └── usage/route.ts
│   │   └── admin/
│   │       ├── characters/route.ts
│   │       └── chat-stats/route.ts
├── lib/
│   ├── chat/
│   │   ├── anthropic.ts                       # client + mock fallback
│   │   ├── prompt.ts                          # buildSystemPrompt
│   │   ├── billing.ts                         # debitForMessage / refundMessage
│   │   └── stream.ts                          # SSE helpers
└── components/
    ├── characters/
    │   ├── CharacterCard.tsx
    │   ├── CharacterForm.tsx
    │   └── CharacterHeader.tsx
    └── chat/
        ├── ChatMessage.tsx
        ├── ChatInput.tsx
        ├── ChatStream.tsx
        ├── ChatHeader.tsx
        └── SessionList.tsx
```

---

## 📅 10. Implementation Roadmap

### Week 1 — Foundation (ไม่มี UI)
- [ ] เพิ่ม Prisma models + migrations (`npx prisma db push`)
- [ ] ติดตั้ง `@anthropic-ai/sdk`
- [ ] `src/lib/chat/anthropic.ts` — client + mock mode
- [ ] `src/lib/chat/prompt.ts` — system prompt builder
- [ ] `src/lib/chat/billing.ts` — `debitForMessage` + transaction tests (manual)
- [ ] `POST /api/chat/sessions/[id]/message` streaming endpoint
- [ ] Manual test ผ่าน curl: สร้าง character ผ่าน Prisma studio → สร้าง session → ส่งข้อความ → ดู SSE stream

### Week 2 — Character CRUD + Discovery
- [ ] `POST/GET /api/characters`
- [ ] `GET/PATCH/DELETE /api/characters/[id]`
- [ ] `/characters` discovery page (copy pattern จาก `/explore`)
- [ ] `/characters/create` form
- [ ] `/characters/[slug]` profile page
- [ ] CharacterCard component

### Week 3 — Chat UI
- [ ] Chat page `/characters/[slug]/chat/[sessionId]`
- [ ] ChatStream consumer (SSE) — streaming text animation
- [ ] ChatInput with coin counter
- [ ] Session list `/my/chats`
- [ ] Error recovery + typing indicator
- [ ] Age gate integration

### Week 4 — Polish, Safety, Launch
- [ ] Report button + CHARACTER target type
- [ ] Admin moderation page
- [ ] Rate limit + daily caps
- [ ] Navbar integration
- [ ] Notification: "นักเขียน X สร้างตัวละครใหม่"
- [ ] Soft launch ให้ 5-10 beta users
- [ ] Monitor cost + refusal rate ใน Anthropic console

### Phase 2 teasers (อย่าเพิ่งทำ)
- Character ↔ Novel integration (ปุ่ม "แชทกับตัวละครจากนิยายนี้" ในหน้า novel)
- Favorite + personalized recommendations
- Character ranking page
- Writer export: "บันทึกบทสนทนานี้เป็น draft chapter"

---

## ⚠️ 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Claude refuse ระหว่างการสนทนาบ่อยเกินไป** | System prompt ระบุ romance/drama ชัด + เลือก character concept ไปทางโรแมนติก ไม่ใช่ kink |
| **LLM cost ทะลุงบ** | Monthly cap ใน Anthropic Console + daily cap per user + cron monitor |
| **Prompt injection** | Sanitize user input + แยก system prompt ออกจาก user content + Claude มี built-in resistance |
| **Spam characters** | Require writer role หรือ email verified + rate limit create (3/วัน) |
| **User ผิดหวังที่ "ไม่ลึก"** | Onboarding copy ชัด: "สนทนาโรแมนติก ดราม่า ผจญภัย — สำหรับคุณคนสวมบทบาท" |
| **ถูกตีความว่า AI โดน confuse** | Disclaimer ที่หน้า character profile + chat footer: "ตัวละครนี้เป็น AI เนื้อหาอาจไม่ถูกต้อง" |
| **ภาษาไทย tone ไม่ธรรมชาติ** | A/B test system prompt variations + collect beta feedback ก่อน GA |

---

## 🎚️ 12. Success Metrics (เช็คหลังเปิด 30 วัน)

| Metric | Target |
|---|---|
| DAU ของฟีเจอร์ | > 15% ของ platform DAU |
| Messages per session (median) | > 10 |
| Sessions per user per week (active) | > 3 |
| Free → paid conversion | > 8% |
| Character creation rate | > 50 characters/week |
| Refusal rate | < 3% ของ messages |
| Avg cost per DAU | < 5 บาท |
| Report rate | < 0.5% ของ characters |

**ถ้า metrics ส่วนใหญ่ผ่าน** → ลุย Phase 2 (Novel integration)
**ถ้าไม่ผ่าน** → investigate: prompt quality? LLM quality? UX? หรือ demand ไม่มีจริง?

---

## 📌 13. Open Questions — ต้องตัดสินใจก่อนเริ่ม

1. **ใครสร้าง character ได้?** — ทุก user / เฉพาะ writer / verified email only?
   - **แนะนำ:** writer role + verified email (กัน spam)
2. **Character สร้างได้กี่ตัวต่อคน?**
   - **แนะนำ:** 10 ตัวใน phase 1, ยกเลิก limit ตาม engagement
3. **Visibility default?**
   - **แนะนำ:** `PUBLIC` default, มี checkbox "สร้างแบบส่วนตัว"
4. **Chat history แสดงในหน้าอะไร?**
   - **แนะนำ:** `/my/chats` แยกจาก `/library` (library = นิยาย, chats = แชท)
5. **Mock mode ใช้ backend reply อะไร?**
   - **แนะนำ:** Canned Thai replies ที่หมุนเวียน 5-10 แบบ + prefix `[MOCK]`
6. **ถ้า user ลบ character ระหว่างที่คนอื่นมี session คาอยู่?**
   - **แนะนำ:** soft delete (`deletedAt` field) + session ยังดูได้ แต่ส่งใหม่ไม่ได้

---

## 📚 References

- Anthropic Messages API — streaming: https://docs.anthropic.com/claude/reference/messages-streaming
- Next.js App Router streaming responses
- `src/lib/payment/omise.ts` — pattern for mock mode
- `src/lib/payment/fulfill.ts` — pattern for atomic db.$transaction billing
- `src/components/safety/AgeGateModal.tsx` — reuse for adult characters
- `competitor-analysis.md` — สำหรับ positioning
