import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // --- Genres ---
  const genres = [
    { name: "โรแมนติก", slug: "romantic", icon: "Heart" },
    { name: "แฟนตาซี", slug: "fantasy", icon: "Sparkles" },
    { name: "แอ็คชัน", slug: "action", icon: "Swords" },
    { name: "สยองขวัญ", slug: "horror", icon: "Ghost" },
    { name: "ลึกลับ/สืบสวน", slug: "mystery", icon: "Search" },
    { name: "นิยายวาย", slug: "boys-love", icon: "HeartHandshake" },
    { name: "นิยายลิลี่", slug: "girls-love", icon: "Cherry" },
    { name: "Sci-Fi", slug: "sci-fi", icon: "Rocket" },
    { name: "ชีวิตจริง", slug: "slice-of-life", icon: "Coffee" },
    { name: "ตลก/ฮาเร็ม", slug: "comedy", icon: "Laugh" },
  ];

  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: {},
      create: genre,
    });
  }
  console.log(`✅ ${genres.length} genres created`);

  // --- Tags ---
  const tags = [
    "พระเอกเย็นชา",
    "นางเอกแกร่ง",
    "แต่งงานก่อนรัก",
    "ย้อนเวลา",
    "ข้ามมิติ",
    "ดราม่า",
    "มาเฟีย",
    "วิทยาเขต",
    "ออฟฟิศ",
    "ซึ้งกินใจ",
    "พระเอกหวงแหน",
    "คุณชาย",
    "CEO",
    "แบดบอย",
    "รักต้องห้าม",
    "สามีข้อตกลง",
    "วิวาห์บังคับ",
    "18+",
    "หนุ่มปริศนา",
    "รุ่นพี่รุ่นน้อง",
  ];

  for (const tagName of tags) {
    await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
  }
  console.log(`✅ ${tags.length} tags created`);

  // --- Demo Users ---
  const passwordHash = hashSync("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@alyn.co" },
    update: {},
    create: {
      email: "admin@alyn.co",
      passwordHash,
      name: "Alyn Admin",
      role: "ADMIN",
      coinBalance: 9999,
    },
  });

  const writer = await prisma.user.upsert({
    where: { email: "writer@alyn.co" },
    update: {},
    create: {
      email: "writer@alyn.co",
      passwordHash,
      name: "นักเขียนตัวอย่าง",
      penName: "ดาวเหนือ",
      role: "WRITER",
      bio: "นักเขียนนิยายโรแมนติกและแฟนตาซี ผลงานกว่า 10 เรื่อง",
      coinBalance: 500,
    },
  });

  const reader = await prisma.user.upsert({
    where: { email: "reader@alyn.co" },
    update: {},
    create: {
      email: "reader@alyn.co",
      passwordHash,
      name: "นักอ่านตัวอย่าง",
      role: "READER",
      coinBalance: 100,
    },
  });
  const writer2 = await prisma.user.upsert({
    where: { email: "writer2@alyn.co" },
    update: {},
    create: {
      email: "writer2@alyn.co",
      passwordHash,
      name: "กัญญารัตน์ วงศ์ประเสริฐ",
      penName: "จันทร์เจ้า",
      role: "WRITER",
      bio: "นักเขียนนิยายโรแมนติก 18+ และมาเฟียโรแมนซ์ ชอบเขียนเรื่องรักซับซ้อนที่จบแฮปปี้",
      coinBalance: 1200,
    },
  });

  const writer3 = await prisma.user.upsert({
    where: { email: "writer3@alyn.co" },
    update: {},
    create: {
      email: "writer3@alyn.co",
      passwordHash,
      name: "ปรมินทร์ ชัยวัฒนา",
      penName: "ฟ้าหลังฝน",
      role: "WRITER",
      bio: "เขียนนิยายวายโรแมนซ์ เน้นความสัมพันธ์ลึกซึ้ง อบอุ่น และสมจริง",
      coinBalance: 800,
    },
  });

  console.log("✅ 5 demo users created (admin, writer x3, reader)");

  // --- Get genre references ---
  const romanticGenre = await prisma.genre.findUnique({ where: { slug: "romantic" } });
  const fantasyGenre = await prisma.genre.findUnique({ where: { slug: "fantasy" } });
  const mysteryGenre = await prisma.genre.findUnique({ where: { slug: "mystery" } });
  const blGenre = await prisma.genre.findUnique({ where: { slug: "boys-love" } });

  const actionGenre = await prisma.genre.findUnique({ where: { slug: "action" } });

  if (!romanticGenre || !fantasyGenre || !mysteryGenre || !blGenre || !actionGenre) {
    throw new Error("Genres not found");
  }

  // --- Get tag references ---
  const tagColdHero = await prisma.tag.findUnique({ where: { name: "พระเอกเย็นชา" } });
  const tagStrongHeroine = await prisma.tag.findUnique({ where: { name: "นางเอกแกร่ง" } });
  const tagTimeTrvel = await prisma.tag.findUnique({ where: { name: "ย้อนเวลา" } });
  const tagDrama = await prisma.tag.findUnique({ where: { name: "ดราม่า" } });
  const tagMafia = await prisma.tag.findUnique({ where: { name: "มาเฟีย" } });
  const tagOffice = await prisma.tag.findUnique({ where: { name: "ออฟฟิศ" } });

  // --- Novels ---
  const novel1 = await prisma.novel.upsert({
    where: { slug: "ruk-kham-dao" },
    update: {},
    create: {
      title: "รักข้ามดาว",
      slug: "ruk-kham-dao",
      synopsis:
        "เรื่องราวของหญิงสาวธรรมดาที่ถูกดึงข้ามมิติไปสู่โลกแฟนตาซี เธอต้องเรียนรู้เวทมนตร์และค้นพบว่าตัวเองคือกุญแจสำคัญในการปกป้องอาณาจักร แต่สิ่งที่ไม่คาดคิดคือเธอได้พบกับรักแท้กับเจ้าชายผู้เย็นชา",
      status: "ONGOING",
      viewCount: 15420,
      authorId: writer.id,
      genreId: fantasyGenre.id,
      tags: {
        connect: [
          { id: tagColdHero!.id },
          { id: tagStrongHeroine!.id },
          { id: tagTimeTrvel!.id },
        ],
      },
    },
  });

  const novel2 = await prisma.novel.upsert({
    where: { slug: "mafia-boss-kap-sao-office" },
    update: {},
    create: {
      title: "มาเฟียบอสกับสาวออฟฟิศ",
      slug: "mafia-boss-kap-sao-office",
      synopsis:
        "เมื่อสาวออฟฟิศธรรมดาบังเอิญเห็นเหตุการณ์ที่ไม่ควรเห็น เธอจึงถูกมาเฟียหนุ่มหล่อจับตัวไว้ใกล้ชิด แต่ยิ่งอยู่ใกล้กัน หัวใจที่เคยแข็งแกร่งก็เริ่มอ่อนไหว...",
      status: "ONGOING",
      viewCount: 32100,
      authorId: writer.id,
      genreId: romanticGenre.id,
      tags: {
        connect: [
          { id: tagMafia!.id },
          { id: tagOffice!.id },
          { id: tagDrama!.id },
        ],
      },
    },
  });

  const novel3 = await prisma.novel.upsert({
    where: { slug: "kadi-luang-tai-ngao" },
    update: {},
    create: {
      title: "คดีลวงใต้เงา",
      slug: "kadi-luang-tai-ngao",
      synopsis:
        "นักสืบหนุ่มผู้มีพรสวรรค์ในการอ่านจิตใจคน ต้องเผชิญกับคดีฆาตกรรมปริศนาที่เหยื่อทุกคนมีรอยยิ้มบนใบหน้า เขาจะไขปริศนานี้ได้หรือไม่ เมื่อคำตอบอาจซ่อนอยู่ในอดีตของตัวเขาเอง",
      status: "COMPLETED",
      viewCount: 8750,
      authorId: writer.id,
      genreId: mysteryGenre.id,
      tags: {
        connect: [{ id: tagDrama!.id }],
      },
    },
  });

  const novel4 = await prisma.novel.upsert({
    where: { slug: "duang-dao-khu-jai" },
    update: {},
    create: {
      title: "ดวงดาวคู่ใจ",
      slug: "duang-dao-khu-jai",
      synopsis:
        "สองชายหนุ่มที่เติบโตมาด้วยกัน ต่างรู้สึกถึงบางสิ่งที่มากกว่ามิตรภาพ แต่สังคมและครอบครัวกลับเป็นกำแพงที่ขวางกั้น พวกเขาจะก้าวข้ามผ่านทุกอุปสรรคเพื่อรักที่แท้จริงได้หรือไม่",
      status: "ONGOING",
      viewCount: 24300,
      authorId: writer.id,
      genreId: blGenre.id,
      tags: {
        connect: [
          { id: tagDrama!.id },
          { id: tagStrongHeroine!.id },
        ],
      },
    },
  });

  console.log("✅ 4 novels created");

  // --- Chapters for novel1 (รักข้ามดาว) ---
  const novel1Chapters = [
    {
      number: 1,
      title: "จุดเริ่มต้นของทุกสิ่ง",
      content: `แสงสว่างจ้าพุ่งเข้ามาจนต้องหลับตา เมื่อลืมตาขึ้นอีกครั้ง อรุณีพบว่าตัวเองกำลังนอนอยู่กลางทุ่งหญ้าสีเขียวขจี ท้องฟ้าเหนือศีรษะมีดวงจันทร์สองดวง\n\n"ที่นี่...ที่ไหน?" เธอพึมพำกับตัวเอง\n\nเสียงฝีเท้าดังมาจากด้านหลัง อรุณีรีบหันไป — ชายหนุ่มในชุดเกราะสีเงินยืนอยู่ตรงนั้น ดวงตาสีน้ำเงินเข้มจ้องมองเธอด้วยสายตาเย็นชา\n\n"มนุษย์โลก...เจ้ามาถึงที่นี่ได้อย่างไร?"\n\nอรุณีกลืนน้ำลาย นี่คือจุดเริ่มต้นของเรื่องราวที่เธอไม่เคยคาดคิดมาก่อน`,
      wordCount: 450,
      isFree: true,
      coinPrice: 0,
    },
    {
      number: 2,
      title: "โลกที่ไม่เคยรู้จัก",
      content: `อรุณีเดินตามชายหนุ่มผู้เรียกตัวเองว่า "เจ้าชายอาเธียร์" ผ่านป่าคริสตัลที่ต้นไม้ทุกต้นเรืองแสงสีฟ้าอ่อน\n\n"อาณาจักรอัสตร้า" อาเธียร์กล่าวโดยไม่หันมามอง "ดินแดนที่ปกครองโดยเวทมนตร์มาหลายพันปี"\n\n"แล้วฉันมาอยู่ที่นี่ได้ยังไง?"\n\n"คำถามที่ดี" เขาหยุดเดิน หันมามองเธอเป็นครั้งแรกด้วยสีหน้าจริงจัง "เพราะเจ้าคือ 'ผู้ถูกเลือก' ตามคำทำนายโบราณ"\n\nอรุณีรู้สึกว่าขาอ่อน — ผู้ถูกเลือก? เธอแค่พนักงานบริษัทธรรมดาคนหนึ่งเท่านั้น`,
      wordCount: 520,
      isFree: true,
      coinPrice: 0,
    },
    {
      number: 3,
      title: "พลังที่ตื่นขึ้น",
      content: `สามวันผ่านไปในปราสาทอัสตร้า อรุณีเริ่มชินกับสิ่งแปลกๆ รอบตัว — คนใช้เวทมนตร์เป็นเรื่องปกติ อาหารลอยมาเสิร์ฟเอง และน้ำในสระเปลี่ยนสีตามอารมณ์\n\nแต่สิ่งที่เธอยังไม่ชินคือสายตาเย็นชาของเจ้าชายอาเธียร์\n\n"วันนี้เจ้าจะเริ่มฝึก" เขากล่าวขณะยื่นหนังสือเก่าคร่ำคร่าให้\n\n"ฝึกอะไร?"\n\n"เวทมนตร์ ถ้าเจ้าเป็นผู้ถูกเลือกจริง พลังของเจ้าจะตื่น"\n\nอรุณีเปิดหนังสือ — ทันทีที่นิ้วสัมผัสหน้ากระดาษ แสงสีทองพุ่งออกมาจากมือของเธอ\n\nดวงตาของอาเธียร์เบิกกว้างเป็นครั้งแรก`,
      wordCount: 480,
      isFree: false,
      coinPrice: 3,
    },
    {
      number: 4,
      title: "ศัตรูในเงามืด",
      content: `ข่าวการมาถึงของ "ผู้ถูกเลือก" แพร่กระจายไปทั่วอาณาจักร ไม่ใช่ทุกคนจะยินดี\n\n"เจ้าหญิงซาร่า ธิดาแห่งอาณาจักรเงามืด ส่งสารมา" ที่ปรึกษาของอาเธียร์กล่าวด้วยน้ำเสียงวิตก\n\nอาเธียร์อ่านสารเงียบๆ ใบหน้าที่ปกติไร้อารมณ์กลับขมวดคิ้วเล็กน้อย\n\n"เขียนว่าอะไร?" อรุณีถาม\n\n"เธอต้องการพบเจ้า..." เขาหยุดชั่วครู่ "...เพื่อพิสูจน์ว่าเจ้าคู่ควรกับคำทำนายหรือไม่"\n\nอรุณีรู้สึกหนาวสะท้าน — ดวงตาสีแดงในภาพของเจ้าหญิงซาร่าราวกับมองทะลุเข้ามาในจิตใจ`,
      wordCount: 510,
      isFree: false,
      coinPrice: 3,
    },
    {
      number: 5,
      title: "หัวใจที่เริ่มละลาย",
      content: `คืนนั้น อรุณีฝึกเวทมนตร์จนดึก เธอนั่งอยู่ริมระเบียงปราสาท มองดวงจันทร์คู่ที่ส่องแสงนวลลงมา\n\n"ยังไม่นอนอีกหรือ?" เสียงของอาเธียร์ดังขึ้นจากด้านหลัง\n\n"นอนไม่หลับ...คิดถึงบ้าน"\n\nเงียบไปครู่ — แล้วอาเธียร์ก็นั่งลงข้างๆ เธอ\n\n"ข้าจะหาทางส่งเจ้ากลับ" เขากล่าวเบาๆ "แต่ตอนนี้...ข้าสัญญาว่าจะปกป้องเจ้า"\n\nอรุณีหันไปมอง — แสงจันทร์สะท้อนในดวงตาสีน้ำเงินของเขา ครั้งแรกที่เธอเห็นความอ่อนโยนในนั้น\n\nหัวใจเต้นแรง...นี่มันอะไรกัน?\n\n"ขอบคุณ...อาเธียร์"\n\nเขาไม่ตอบ แต่มุมปากขยับเล็กน้อย — อาจเป็นรอยยิ้มแรกที่เธอเคยเห็น`,
      wordCount: 530,
      isFree: false,
      coinPrice: 5,
    },
  ];

  for (const ch of novel1Chapters) {
    await prisma.chapter.upsert({
      where: {
        novelId_number: { novelId: novel1.id, number: ch.number },
      },
      update: {},
      create: {
        ...ch,
        novelId: novel1.id,
        authorId: writer.id,
        publishedAt: new Date(),
      },
    });
  }

  // --- Chapters for novel2 (มาเฟียบอส) ---
  const novel2Chapters = [
    {
      number: 1,
      title: "คืนที่เปลี่ยนชีวิต",
      content: `ปิ่นมณีเดินออกจากออฟฟิศเวลาสี่ทุ่ม ถนนเปลี่ยว ไฟสลัว เธอเลือกทางลัดผ่านตรอกหลังตึกเหมือนทุกวัน\n\nแต่คืนนี้ไม่เหมือนทุกวัน\n\nเสียงปืนดังสนั่น — ปิ่นมณีหยุดชะงัก ร่างชายตัวใหญ่ล้มลงตรงหน้า เลือดกระจาย\n\nด้านหลังร่างนั้น ชายหนุ่มในสูทดำยืนถือปืน ใบหน้าคมราวกับแกะสลัก ดวงตาเย็นเฉียบ\n\nสายตาของเขาหันมาสบกับเธอ\n\n"เธอ...เห็นทุกอย่าง"`,
      wordCount: 400,
      isFree: true,
      coinPrice: 0,
    },
    {
      number: 2,
      title: "กรงทอง",
      content: `ปิ่นมณีตื่นขึ้นในห้องหรูหราที่เธอไม่รู้จัก เตียงนุ่มราวกับเมฆ ผ้าม่านไหมสีทอง\n\n"ตื่นแล้วหรือ?" เสียงทุ้มดังมาจากโซฟา\n\nชายในสูทดำคนเดิมนั่งอยู่ตรงนั้น กำลังจิบกาแฟอย่างสบายใจ\n\n"คุณ...คุณเป็นใคร? ปล่อยฉันไป!"\n\n"ธนวัฒน์" เขากล่าวสั้นๆ "และไม่ได้ — จนกว่าฉันจะมั่นใจว่าเธอไม่เป็นอันตราย"\n\nปิ่นมณีกลืนน้ำลาย — 'ธนวัฒน์' ชื่อนี้เธอเคยเห็นในข่าว นักธุรกิจหนุ่มพันล้าน ที่ลือกันว่าเบื้องหลังคือ...\n\nมาเฟีย`,
      wordCount: 460,
      isFree: true,
      coinPrice: 0,
    },
    {
      number: 3,
      title: "กฎของเกม",
      content: `"ฉันจะไม่บอกใคร สาบานได้!" ปิ่นมณีพูดด้วยน้ำเสียงสั่น\n\nธนวัฒน์ยกมุมปาก "คำสาบานของคนแปลกหน้าไม่มีค่า" เขาเดินเข้ามาใกล้ "แต่ฉันมีข้อเสนอ"\n\n"อะไร?"\n\n"เป็นเลขาส่วนตัวของฉัน 6 เดือน ถ้าเธอพิสูจน์ได้ว่าไว้ใจได้ ฉันจะปล่อยเธอไป"\n\n"บ้า! ฉันมีงานประจำ!"\n\n"ซึ่งฉันจัดการเรียบร้อยแล้ว" เขายื่นโทรศัพท์ให้ดู — อีเมลจาก HR บริษัทเก่าแจ้งว่าเธอถูก 'โอนย้าย' ไปบริษัท T.W. Group\n\nปิ่นมณีรู้สึกว่าโลกทั้งใบกำลังพังทลาย`,
      wordCount: 490,
      isFree: false,
      coinPrice: 3,
    },
  ];

  for (const ch of novel2Chapters) {
    await prisma.chapter.upsert({
      where: {
        novelId_number: { novelId: novel2.id, number: ch.number },
      },
      update: {},
      create: {
        ...ch,
        novelId: novel2.id,
        authorId: writer.id,
        publishedAt: new Date(),
      },
    });
  }

  // Short chapters for novel3 & novel4
  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel3.id, number: 1 } },
    update: {},
    create: {
      number: 1,
      title: "ศพที่ยิ้ม",
      content:
        "เช้าตรู่ของวันจันทร์ เสียงโทรศัพท์ดังกึกก้องในห้องมืด ร้อยตำรวจโทณัฐวุฒิหยิบสายอย่างเสียไม่ได้ 'มีศพที่ซอยสุขุมวิท 31 ครับ' เสียงจากปลายสาย 'แปลกมากครับ...ศพยิ้มอยู่'\n\nเขารีบแต่งตัวออกจากบ้าน ไม่รู้ว่าคดีนี้จะพาเขาไปสู่ความจริงที่เขาไม่เคยอยากรู้...",
      wordCount: 320,
      isFree: true,
      coinPrice: 0,
      novelId: novel3.id,
      authorId: writer.id,
      publishedAt: new Date(),
    },
  });

  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel4.id, number: 1 } },
    update: {},
    create: {
      number: 1,
      title: "เพื่อนบ้าน",
      content:
        "ภูมิจำได้ดี วันที่เด็กชายตัวเล็กย้ายมาอยู่บ้านข้างๆ ดวงตากลมโต ผิวขาวซีด ยิ้มอายๆ\n\n'สวัสดีครับ ผมชื่อฟ้า' เสียงเบาราวกับกลัวจะรบกวนใคร\n\nตั้งแต่วันนั้น ทุกเช้าภูมิจะปีนรั้วไปหาฟ้า ทุกเย็นสองคนจะนั่งดูพระอาทิตย์ตกด้วยกัน\n\nสิบห้าปีผ่านไป ทุกอย่างเปลี่ยน — ยกเว้นความรู้สึกที่ภูมิมีต่อฟ้า ที่ยิ่งนานยิ่งลึก จนเขาไม่กล้าเรียกมันว่า 'มิตรภาพ' อีกต่อไป",
      wordCount: 380,
      isFree: true,
      coinPrice: 0,
      novelId: novel4.id,
      authorId: writer.id,
      publishedAt: new Date(),
    },
  });

  // --- New tags references ---
  const tagPossessive = await prisma.tag.findUnique({ where: { name: "พระเอกหวงแหน" } });
  const tagCEO = await prisma.tag.findUnique({ where: { name: "CEO" } });
  const tagBadBoy = await prisma.tag.findUnique({ where: { name: "แบดบอย" } });
  const tagForbidden = await prisma.tag.findUnique({ where: { name: "รักต้องห้าม" } });
  const tagContractMarriage = await prisma.tag.findUnique({ where: { name: "สามีข้อตกลง" } });
  const tagForcedMarriage = await prisma.tag.findUnique({ where: { name: "วิวาห์บังคับ" } });
  const tag18Plus = await prisma.tag.findUnique({ where: { name: "18+" } });
  const tagMystery = await prisma.tag.findUnique({ where: { name: "หนุ่มปริศนา" } });
  const tagSeniorJunior = await prisma.tag.findUnique({ where: { name: "รุ่นพี่รุ่นน้อง" } });
  const tagMarried = await prisma.tag.findUnique({ where: { name: "แต่งงานก่อนรัก" } });

  // ======================================
  // โรแมนติกดราม่า 18+ (4 เรื่อง)
  // ======================================

  // --- เรื่อง 5: สามีข้อตกลง ---
  const novel5 = await prisma.novel.upsert({
    where: { slug: "samee-kho-tok-long" },
    update: {},
    create: {
      title: "สามีข้อตกลง",
      slug: "samee-kho-tok-long",
      synopsis: "เมื่อลูกสาวตระกูลใหญ่ถูกบังคับให้แต่งงานกับทายาทธุรกิจที่เธอไม่เคยรู้จัก ทั้งสองตกลงว่าจะเป็นแค่สามีภรรยาบนกระดาษ แต่การใช้ชีวิตใต้หลังคาเดียวกันทำให้เส้นแบ่งระหว่างข้อตกลงกับความรู้สึกจริงเริ่มเลือนลาง ยิ่งเมื่อคืนที่ฝนตก เขากลับเอื้อมมือมากอดเธอ...",
      status: "ONGOING",
      viewCount: 48200,
      isAdult: true,
      authorId: writer2.id,
      genreId: romanticGenre.id,
      tags: { connect: [{ id: tagContractMarriage!.id }, { id: tagMarried!.id }, { id: tag18Plus!.id }, { id: tagCEO!.id }] },
    },
  });

  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel5.id, number: 1 } },
    update: {},
    create: {
      number: 1, title: "คืนวิวาห์", novelId: novel5.id, authorId: writer2.id,
      content: `พิมพ์ใจยืนในชุดเจ้าสาวสีขาวบริสุทธิ์ มองชายที่ยืนรอเธออยู่ปลายพรมแดง — ภัทรพล ทายาทเครือข่ายธุรกิจพันล้าน หน้าตาหล่อคมราวกับนายแบบ แต่ดวงตากลับว่างเปล่าไร้ความรู้สึก\n\nเขาหันมามองเธอ กระซิบเบาจนแทบไม่ได้ยิน\n\n"หนึ่งปี แค่หนึ่งปี จากนั้นเราจะหย่า"\n\nพิมพ์ใจกลืนน้ำลาย พยักหน้า\n\nค่ำคืนนั้นในห้องสวีทโรงแรมหรู ทั้งสองนั่งคนละฝั่งเตียง ความเงียบหนักอึ้ง\n\n"ผมนอนโซฟา" เขาพูดสั้นๆ แล้วคว้าหมอนเดินออกไป\n\nพิมพ์ใจมองหลังเขาที่หายไปหลังประตู — ทำไมหัวใจถึงรู้สึกหน่วงๆ ทั้งที่นี่แค่ข้อตกลง?`,
      wordCount: 480, isFree: true, coinPrice: 0, publishedAt: new Date(),
    },
  });
  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel5.id, number: 2 } },
    update: {},
    create: {
      number: 2, title: "เส้นที่ไม่ควรข้าม", novelId: novel5.id, authorId: writer2.id,
      content: `สัปดาห์แรกของชีวิตคู่ปลอมๆ ผ่านไปอย่างเชื่องช้า ภัทรพลออกจากบ้านตั้งแต่เช้า กลับมาดึก ทั้งสองแทบไม่พูดกัน\n\nจนกระทั่งคืนฝนตก ฟ้าผ่าสนั่น — พิมพ์ใจกลัวฟ้าร้องตั้งแต่เด็ก เธอนั่งกอดเข่าสั่นอยู่บนเตียง\n\nประตูห้องเปิดออก ภัทรพลยืนอยู่ตรงนั้น ผมเปียกชุ่ม เสื้อเชิ้ตสีขาวปลดกระดุมบนลงมาสองเม็ด\n\n"ร้องไห้ทำไม?" เสียงเขาไม่ได้เย็นชาเหมือนเคย\n\n"ฉัน...ฉันกลัวฟ้าร้อง" เธอพูดเสียงสั่น\n\nเงียบไปครู่ แล้วเขาก็เดินเข้ามานั่งข้างเธอ มือใหญ่ยกขึ้นวางบนศีรษะเธอเบาๆ\n\n"งั้นผมนอนที่นี่ จนกว่าฝนจะหยุด"\n\nหัวใจพิมพ์ใจเต้นแรงจนแทบหายใจไม่ทัน`,
      wordCount: 520, isFree: true, coinPrice: 0, publishedAt: new Date(),
    },
  });
  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel5.id, number: 3 } },
    update: {},
    create: {
      number: 3, title: "เช้าหลังฝน", novelId: novel5.id, authorId: writer2.id,
      content: `แสงแดดอ่อนลอดผ่านม่าน พิมพ์ใจลืมตาขึ้น — แล้วหยุดหายใจ\n\nเธอนอนซุกอยู่ในอ้อมแขนภัทรพล หน้าชิดอกเขา ได้กลิ่นน้ำหอมจางๆ ปนกับความอบอุ่นที่ทำให้ใจเต้นระรัว\n\nเมื่อคืนเธอคงเผลอหลับไป...\n\nภัทรพลขยับ ดวงตาเปิดขึ้นช้าๆ สบตากับเธอ สองคนแข็งค้างไปพร้อมกัน\n\n"ขอ...ขอโทษ!" พิมพ์ใจรีบถอยห่าง หน้าร้อนผ่าว\n\nเขามองเธอนิ่ง แล้วลุกขึ้นโดยไม่พูดอะไร เดินตรงไปห้องน้ำ\n\nเสียงน้ำจากฝักบัวดังขึ้น พิมพ์ใจกดอกตัวเอง — ทำไมยังรู้สึกถึงความอบอุ่นตรงนั้นอยู่เลย?\n\nข้อตกลงนี้...เริ่มซับซ้อนกว่าที่คิด`,
      wordCount: 490, isFree: false, coinPrice: 5, publishedAt: new Date(),
    },
  });

  // --- เรื่อง 6: คุณชายสั่งรัก ---
  const novel6 = await prisma.novel.upsert({
    where: { slug: "khun-chai-sang-ruk" },
    update: {},
    create: {
      title: "คุณชายสั่งรัก",
      slug: "khun-chai-sang-ruk",
      synopsis: "แพรวา สาวทุนนิยมที่ทำงานสองกะเพื่อส่งน้องเรียน ต้องมาเป็นแม่บ้านในคฤหาสน์ของ 'คุณชายวิน' ทายาทตระกูลเก่าแก่ผู้ขึ้นชื่อเรื่องเจ้าอารมณ์และหยิ่งยโส แต่เบื้องหลังความเย็นชา เขาซ่อนบาดแผลที่ไม่เคยบอกใคร และแพรวาคือคนแรกที่ทำให้กำแพงนั้นร้าว...",
      status: "ONGOING",
      viewCount: 35800,
      isAdult: true,
      authorId: writer2.id,
      genreId: romanticGenre.id,
      tags: { connect: [{ id: tagPossessive!.id }, { id: tagDrama!.id }, { id: tag18Plus!.id }, { id: tagColdHero!.id }] },
    },
  });

  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel6.id, number: 1 } },
    update: {},
    create: {
      number: 1, title: "แม่บ้านคนใหม่", novelId: novel6.id, authorId: writer2.id,
      content: `แพรวายืนหน้าคฤหาสน์สีขาวขนาดมหึมา กลืนน้ำลายแห้งๆ เงินเดือนที่นี่มากกว่างานเดิมสามเท่า เธอทนได้\n\n"คุณคือแม่บ้านคนใหม่?" เสียงทุ้มดังมาจากด้านบนบันได\n\nชายหนุ่มในเสื้อเชิ้ตขาว กระดุมบนปลดออก เผยให้เห็นกระดูกไหปลาร้า เขาเดินลงบันไดอย่างเชื่องช้า ทุกก้าวเต็มไปด้วยอำนาจ\n\n"ค่ะ แพรวาค่ะ"\n\n"กฎข้อแรก" เขาหยุดตรงหน้าเธอ ใกล้จนเธอได้กลิ่นน้ำหอม "ห้ามเข้าชั้นสามทุกกรณี"\n\n"ค่ะ"\n\n"กฎข้อสอง ห้ามถามเรื่องส่วนตัว"\n\n"ค่ะ"\n\n"ดี" เขาหันหลังเดินขึ้นบันไดไป\n\nแพรวาปล่อมลมหายใจยาว — อยู่กับคนแบบนี้ หนึ่งปีคงยาวนานมาก`,
      wordCount: 510, isFree: true, coinPrice: 0, publishedAt: new Date(),
    },
  });
  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel6.id, number: 2 } },
    update: {},
    create: {
      number: 2, title: "กำแพงที่ร้าว", novelId: novel6.id, authorId: writer2.id,
      content: `สองอาทิตย์ผ่านไป แพรวาเริ่มชินกับนิสัยของคุณชายวิน — เขากินแต่กาแฟดำ อ่านหนังสือจนดึก และไม่เคยยิ้ม\n\nจนกระทั่งคืนหนึ่ง เธอเผลอเดินผ่านชั้นสามเพื่อไปปิดหน้าต่างที่ลมพัดเปิด\n\nเสียงเปียโนดังแผ่วมาจากห้องปลายทาง ท่วงทำนองเศร้าจนแพรวาหยุดฟัง\n\nประตูเปิดอยู่ครึ่งบาน — วินนั่งอยู่หน้าเปียโน ไหล่สั่นเบาๆ\n\nเขาร้องไห้\n\nแพรวาถอยหลังเงียบๆ แต่เท้าเหยียบพื้นไม้ดัง เอี๊ยด\n\nวินหันมา ดวงตาแดงก่ำ สบกับเธอ\n\n"ฉันบอกแล้ว...ห้ามขึ้นชั้นสาม"\n\nเสียงเขาสั่น ไม่ใช่เพราะโกรธ — แต่เพราะเขากำลังพังทลาย`,
      wordCount: 480, isFree: false, coinPrice: 3, publishedAt: new Date(),
    },
  });

  // --- เรื่อง 7: บ่วงรักทรราช ---
  const novel7 = await prisma.novel.upsert({
    where: { slug: "buang-ruk-thorarat" },
    update: {},
    create: {
      title: "บ่วงรักทรราช",
      slug: "buang-ruk-thorarat",
      synopsis: "นรินทร์ — CEO หนุ่มไร้ปราณีที่ทุกคนเกรงกลัว กลับหมกมุ่นกับหญิงสาวธรรมดาที่บังเอิญช่วยชีวิตเขาในคืนฝนตก เขาใช้ทุกวิถีทางเพื่อผูกมัดเธอไว้ข้างกาย ไม่ว่าเธอจะยินยอมหรือไม่ แต่ยิ่งพยายามครอบครอง เขาก็ยิ่งค้นพบว่าตัวเองต่างหากที่ถูกเธอพันธนาการ...",
      status: "ONGOING",
      viewCount: 56700,
      isAdult: true,
      authorId: writer2.id,
      genreId: romanticGenre.id,
      tags: { connect: [{ id: tagPossessive!.id }, { id: tagCEO!.id }, { id: tag18Plus!.id }, { id: tagDrama!.id }] },
    },
  });

  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel7.id, number: 1 } },
    update: {},
    create: {
      number: 1, title: "คืนฝนที่เปลี่ยนทุกอย่าง", novelId: novel7.id, authorId: writer2.id,
      content: `ฝนตกหนักกลางกรุงเทพ กานต์ธิดาวิ่งฝ่าสายฝนเพื่อไปขึ้นรถเมล์เที่ยวสุดท้าย\n\nเธอเห็นชายในสูทราคาแพงล้มอยู่ข้างถนน เลือดไหลจากศีรษะ\n\n"คุณ! คุณเป็นอะไร!"\n\nเธอรีบเข้าไปช่วย โทรเรียกรถพยาบาล ประคองศีรษะเขาไว้ในอ้อมแขนท่ามกลางสายฝน\n\nดวงตาสีเข้มเปิดขึ้น จ้องมองเธอ\n\n"ชื่อ..." เขากระซิบ "ชื่ออะไร..."\n\n"กานต์ธิดาค่ะ แต่ไม่ต้องพูด ประหยัดแรงไว้ก่อน"\n\nรถพยาบาลมาถึง เธอมองรถจากไปในสายฝน — ไม่รู้ด้วยซ้ำว่าชายคนนั้นคือใคร\n\nแต่นรินทร์รู้ เขาจำทุกรายละเอียดของใบหน้าเธอในสายฝนคืนนั้น\n\nและเขาจะตามหาเธอให้เจอ ไม่ว่าจะต้องแลกด้วยอะไร`,
      wordCount: 530, isFree: true, coinPrice: 0, publishedAt: new Date(),
    },
  });
  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel7.id, number: 2 } },
    update: {},
    create: {
      number: 2, title: "ผู้ชายที่ปฏิเสธไม่ได้", novelId: novel7.id, authorId: writer2.id,
      content: `สามวันหลังจากคืนนั้น กานต์ธิดานั่งทำงานอยู่ในร้านกาแฟเล็กๆ\n\nรถหรูสีดำจอดหน้าร้าน ชายในสูทสั่งตัดเดินเข้ามา — ใบหน้าเดียวกับคืนฝนตก แต่คราวนี้ไม่มีเลือดและสายฝน มีแต่ออร่าที่ทำให้ทุกคนในร้านหันมอง\n\n"กานต์ธิดา" เขาเรียกชื่อเธอ\n\n"คุณ...คุณหายดีแล้วเหรอคะ? แต่คุณรู้ชื่อฉันได้ยังไง?"\n\n"ผมรู้ทุกอย่างเกี่ยวกับเธอ" เขานั่งลงตรงข้าม วางกล่องกำมะหยี่สีดำบนโต๊ะ "และผมมาเพื่อตอบแทน"\n\nในกล่องคือสร้อยคอเพชร ราคาคงเท่ากับค่าเช่าห้องเธอหลายสิบปี\n\n"ฉันรับไม่ได้ค่ะ"\n\n"งั้นรับสิ่งนี้แทน" เขาหยิบนามบัตรวางลง "ตำแหน่งเลขาส่วนตัว เงินเดือนหกหลัก"\n\n"ทำไมต้องฉัน?"\n\nเขาเอียงศีรษะเล็กน้อย มุมปากยกขึ้น "เพราะผมไม่เคยเป็นหนี้ใคร"`,
      wordCount: 540, isFree: false, coinPrice: 3, publishedAt: new Date(),
    },
  });

  // --- เรื่อง 8: วิวาห์ลวง สัญญารัก ---
  const novel8 = await prisma.novel.upsert({
    where: { slug: "wiwah-luang-sanya-ruk" },
    update: {},
    create: {
      title: "วิวาห์ลวง สัญญารัก",
      slug: "wiwah-luang-sanya-ruk",
      synopsis: "มิ้นท์ถูกพ่อบังคับให้แต่งงานกับลูกชายคู่ธุรกิจที่เธอเกลียดที่สุด — ธีรภัทร ผู้ชายเจ้าชู้ ปากร้าย และหยิ่งยโส แต่หลังประตูห้องนอน เมื่อไม่มีใครมอง เขากลับเป็นคนละคน เขาดูแลเธอ ปกป้องเธอ และมองเธอด้วยสายตาที่ทำให้หัวใจเต้นผิดจังหวะ วิวาห์ที่เริ่มจากคำสั่ง กำลังจะกลายเป็นรักแท้...",
      status: "COMPLETED",
      viewCount: 67300,
      isAdult: true,
      authorId: writer2.id,
      genreId: romanticGenre.id,
      tags: { connect: [{ id: tagForcedMarriage!.id }, { id: tagMarried!.id }, { id: tag18Plus!.id }, { id: tagPossessive!.id }] },
    },
  });

  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel8.id, number: 1 } },
    update: {},
    create: {
      number: 1, title: "เจ้าบ่าวที่ไม่ต้องการ", novelId: novel8.id, authorId: writer2.id,
      content: `"แต่งงาน!? พ่อบ้าไปแล้ว!"\n\nมิ้นท์ทุบโต๊ะจนแก้วน้ำหก พ่อของเธอนั่งสงบนิ่งเหมือนไม่มีอะไรเกิดขึ้น\n\n"ธีรภัทรเป็นเด็กดี ตระกูลดี ธุรกิจเราจะโตสิบเท่า"\n\n"เขาเปลี่ยนผู้หญิงทุกอาทิตย์! ลูกไม่แต่ง!"\n\nพ่อถอนหายใจ "ถ้าลูกไม่แต่ง บริษัทล้ม คนงานสองพันคนตกงาน"\n\nมิ้นท์เงียบ — เธอรู้ว่านี่ไม่ใช่แค่คำขู่\n\nหนึ่งเดือนต่อมา เธอยืนในชุดเจ้าสาว หน้าตรงข้ามกับธีรภัทร\n\nเขาเอียงตัวมากระซิบข้างหู "ไม่ต้องกลัว ผมไม่สนใจเธอหรอก"\n\nมิ้นท์กัดฟัน — ดี เพราะเธอก็ไม่สนใจเขาเหมือนกัน\n\nแต่ทำไมหัวใจถึงเจ็บนิดนึง...`,
      wordCount: 500, isFree: true, coinPrice: 0, publishedAt: new Date(),
    },
  });

  // ======================================
  // วายโรแมนซ์ (3 เรื่อง)
  // ======================================

  // --- เรื่อง 9: รุ่นพี่ที่รัก ---
  const novel9 = await prisma.novel.upsert({
    where: { slug: "run-phee-thee-ruk" },
    update: {},
    create: {
      title: "รุ่นพี่ที่รัก",
      slug: "run-phee-thee-ruk",
      synopsis: "เฟิร์ส นักศึกษาปี 1 ตัวเล็ก เงียบขรึม ได้รุ่นพี่ SOTUS ที่โหดที่สุดในคณะ — 'พี่ณัฐ' หัวหน้าว้ากปี 4 รูปหล่อ ดุ ไม่ยิ้ม แต่ทุกครั้งที่เฟิร์สล้ม พี่ณัฐเป็นคนแรกที่ยื่นมือมาจับ เมื่อความรู้สึกที่มากกว่าความเคารพเริ่มก่อตัว ทั้งสองต้องเผชิญกับคำถามที่ยากที่สุด — ถ้าเป็นผู้ชายด้วยกัน รักกันได้ไหม?",
      status: "ONGOING",
      viewCount: 41500,
      isAdult: true,
      authorId: writer3.id,
      genreId: blGenre.id,
      tags: { connect: [{ id: tagSeniorJunior!.id }, { id: tag18Plus!.id }, { id: tagColdHero!.id }, { id: tagDrama!.id }] },
    },
  });

  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel9.id, number: 1 } },
    update: {},
    create: {
      number: 1, title: "วันว้ากแรก", novelId: novel9.id, authorId: writer3.id,
      content: `เฟิร์สยืนท่ามกลางเด็กปีหนึ่งนับร้อย ทุกคนสวมเครื่องแบบขาว ใบหน้าเต็มไปด้วยความตื่นเต้นปนกลัว\n\n"ทุกคนหันหน้ามาทางนี้!"\n\nเสียงทุ้มดังก้องสนาม เฟิร์สเงยหน้าขึ้น — รุ่นพี่ตัวสูง ไหล่กว้าง ผมสั้นเรียบ ใบหน้าคมเข้มไม่มียิ้ม เดินมาหยุดตรงหน้าแถว\n\n"ผม ณัฐวัฒน์ หัวหน้าว้ากปีนี้ กฎมีข้อเดียว — สั่งอะไรทำอย่างนั้น ไม่มีข้อยกเว้น"\n\nเด็กปีหนึ่งเงียบกริบ\n\nพี่ณัฐเดินตรวจแถว หยุดตรงหน้าเฟิร์ส\n\n"ชื่ออะไร?"\n\n"เฟิร์สครับ"\n\nสายตาเย็นจัดกวาดมองเขาจากหัวจรดเท้า "ตัวเล็กจัง ไหวไหม?"\n\nเฟิร์สกัดฟัน "ไหวครับ"\n\nมุมปากพี่ณัฐขยับเล็กน้อย — แต่ไม่ใช่รอยยิ้ม "ได้ พิสูจน์ให้ดู"`,
      wordCount: 520, isFree: true, coinPrice: 0, publishedAt: new Date(),
    },
  });
  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel9.id, number: 2 } },
    update: {},
    create: {
      number: 2, title: "มือที่ยื่นมา", novelId: novel9.id, authorId: writer3.id,
      content: `กิจกรรมว้ากวันที่สาม วิ่งรอบสนาม 20 รอบ\n\nเฟิร์สรู้ว่าร่างกายตัวเองไม่แข็งแรงเท่าคนอื่น เขาเริ่มหอบตั้งแต่รอบที่ 8 รอบที่ 15 ขาสั่น รอบที่ 18 สายตาพร่ามัว\n\nรอบที่ 19 — เข่าทรุด เขาล้มคว่ำลงกับพื้น\n\n"ลุกขึ้น!" เสียงรุ่นพี่คนอื่นตะโกน\n\nเฟิร์สพยายามยันตัวขึ้น แต่แขนสั่นหมดแรง\n\nแล้วมือใหญ่ก็ยื่นมาตรงหน้า\n\n"จับ"\n\nเฟิร์สเงยหน้า — พี่ณัฐยืนอยู่ตรงนั้น สีหน้าเรียบเฉย แต่ดวงตากลับมีบางอย่างที่เฟิร์สอ่านไม่ออก\n\nเขาจับมือพี่ณัฐ ถูกดึงขึ้นยืนอย่างง่ายดาย ราวกับเขาไม่มีน้ำหนัก\n\n"อีกรอบเดียว เดินก็ได้" พี่ณัฐพูดเบาๆ จนเฉพาะเฟิร์สได้ยิน\n\nมือที่เพิ่งจับ ยังรู้สึกอุ่นอยู่ตรงฝ่ามือ`,
      wordCount: 510, isFree: true, coinPrice: 0, publishedAt: new Date(),
    },
  });

  // --- เรื่อง 10: กลรักนายจอมหยิ่ง ---
  const novel10 = await prisma.novel.upsert({
    where: { slug: "kon-ruk-nai-jom-ying" },
    update: {},
    create: {
      title: "กลรักนายจอมหยิ่ง",
      slug: "kon-ruk-nai-jom-ying",
      synopsis: "เต้ ดีไซเนอร์หนุ่มร่าเริง ต้องไปทำงานกับ 'ก้อง' สถาปนิกจอมหยิ่งที่ไม่เคยพอใจผลงานใคร ทั้งสองทะเลาะกันทุกวัน จนเพื่อนร่วมงานแอบพนันว่าใครจะฆ่าใครก่อน แต่ไม่มีใครรู้ว่าตอนดึกๆ ก้องแอบเปิดดู Instagram เต้ และเต้ก็แอบวาดรูปก้องในสมุดสเก็ตช์...",
      status: "ONGOING",
      viewCount: 29400,
      isAdult: true,
      authorId: writer3.id,
      genreId: blGenre.id,
      tags: { connect: [{ id: tagBadBoy!.id }, { id: tagOffice!.id }, { id: tag18Plus!.id }] },
    },
  });

  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel10.id, number: 1 } },
    update: {},
    create: {
      number: 1, title: "วันแรกที่นรก", novelId: novel10.id, authorId: writer3.id,
      content: `"ผลงานอะไรของนาย ระดับเด็กมัธยมยังทำได้ดีกว่า"\n\nก้องโยนแบบลงบนโต๊ะ ใบหน้าเรียบเฉย ราวกับเพิ่งพูดเรื่องอากาศ\n\nเต้กำมือแน่น — เขาไม่เคยโดนใครดูถูกผลงานแบบนี้\n\n"พี่ก้องครับ ผมแก้มาสามรอบแล้ว"\n\n"งั้นแก้รอบสี่ ไม่ดีก็แก้ไปจนกว่าจะดี"\n\nก้องหันหลังเดินไป ทิ้งให้เต้นั่งกัดฟันอยู่คนเดียว\n\n"อดทน อดทน..." เต้บ่นกับตัวเอง\n\nเขาเปิดสมุดสเก็ตช์ ปากก็ด่าก้อง มือก็วาดหน้าก้อง — ขากรรไกรคม คิ้วหนา ริมฝีปากบาง\n\nวาดเสร็จ เต้มองรูป แล้วปิดสมุดแรงๆ\n\n"บ้า ทำไมวาดหล่ออีก"`,
      wordCount: 490, isFree: true, coinPrice: 0, publishedAt: new Date(),
    },
  });

  // --- เรื่อง 11: คืนนั้นที่จำไม่ได้ ---
  const novel11 = await prisma.novel.upsert({
    where: { slug: "khuen-nan-thee-jam-mai-dai" },
    update: {},
    create: {
      title: "คืนนั้นที่จำไม่ได้",
      slug: "khuen-nan-thee-jam-mai-dai",
      synopsis: "ตื่นมาในห้องโรงแรมที่ไม่รู้จัก ข้างกายมีผู้ชายแปลกหน้านอนอยู่ ภาพ์ — นักธุรกิจหนุ่มที่เพิ่งอกหักจากแฟนเก่า จำอะไรไม่ได้เลยจากคืนที่ผ่านมา และชายข้างกายนั้นคือ 'แทน' บาร์เทนเดอร์ที่ยิ้มเหมือนไม่มีอะไรเกิดขึ้น ทั้งสองตกลงจะลืมคืนนั้น แต่เมืองกรุงเทพกลับเล็กกว่าที่คิด...",
      status: "ONGOING",
      viewCount: 37800,
      isAdult: true,
      authorId: writer3.id,
      genreId: blGenre.id,
      tags: { connect: [{ id: tagMystery!.id }, { id: tag18Plus!.id }, { id: tagDrama!.id }] },
    },
  });

  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel11.id, number: 1 } },
    update: {},
    create: {
      number: 1, title: "เช้าที่ไม่คาดคิด", novelId: novel11.id, authorId: writer3.id,
      content: `แสงแดดแทงตา ศีรษะปวดราวจะระเบิด ภาพ์ลืมตาขึ้นอย่างทุลักทุเล\n\nเพดานสีขาว ผ้าม่านโรงแรม — ไม่ใช่ห้องเขา\n\nแล้วเขาก็รู้สึกถึงไออุ่นข้างตัว\n\nหันไปช้าๆ — ผู้ชาย ผมยาวประบ่า ใบหน้าหล่อแบบอ่อนโยน นอนหลับอยู่ข้างเขา ผ้าห่มคลุมถึงเอว\n\nภาพ์มองลงไปที่ตัวเอง — เสื้อหาย\n\n"อะ...อะไร!?" เขากระโดดลงจากเตียง\n\nชายข้างกายขยับ ลืมตา ยิ้มง่วงๆ\n\n"เฮ้ เช้าแล้วเหรอ?"\n\n"นาย...นายเป็นใคร!? เมื่อคืนเกิดอะไรขึ้น!?"\n\nชายคนนั้นนั่งขึ้น เกาหัว "ผมชื่อแทน เมื่อคืนพี่เมาหนักมาก ผมแค่พา—"\n\n"พาอะไร!?"\n\nแทนยิ้ม — รอยยิ้มที่อ่านไม่ออกว่าซื่อหรือร้าย\n\n"พาพี่มานอนพักครับ แค่นั้น ...จริงๆ"`,
      wordCount: 500, isFree: true, coinPrice: 0, publishedAt: new Date(),
    },
  });

  // ======================================
  // มาเฟียโรแมนซ์ (3 เรื่อง)
  // ======================================

  // --- เรื่อง 12: เพชรในมือมาร ---
  const novel12 = await prisma.novel.upsert({
    where: { slug: "phet-nai-mue-marn" },
    update: {},
    create: {
      title: "เพชรในมือมาร",
      slug: "phet-nai-mue-marn",
      synopsis: "ลัลลิตา พยาบาลสาวใจดี ถูกลักพาตัวมารักษาบอสมาเฟียที่โดนยิง เธอตั้งใจจะหนีทันทีที่เขาหายดี แต่ชายคนนี้กลับไม่ปล่อยให้เธอไปไหน 'เธอเห็นหน้าฉันแล้ว มีสองทางเลือก — อยู่กับฉัน หรือหายไปจากโลกนี้' แต่สายตาที่มองเธอกลับไม่ใช่สายตาของคนจะทำร้าย...",
      status: "ONGOING",
      viewCount: 52100,
      isAdult: true,
      authorId: writer2.id,
      genreId: actionGenre.id,
      tags: { connect: [{ id: tagMafia!.id }, { id: tagPossessive!.id }, { id: tag18Plus!.id }, { id: tagStrongHeroine!.id }] },
    },
  });

  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel12.id, number: 1 } },
    update: {},
    create: {
      number: 1, title: "ผู้ป่วยปริศนา", novelId: novel12.id, authorId: writer2.id,
      content: `ตีสาม โทรศัพท์ดัง ลัลลิตาลุกจากเตียงอย่างงัวเงีย\n\n"สวัสดีค่ะ?"\n\n"มีคนต้องการหมอ ตอนนี้ เดี๋ยวนี้ จ่ายเท่าไหร่ก็ได้"\n\n"ฉันเป็นพยาบาล ไม่ใช่หม—"\n\n"ห้าแสน"\n\nลัลลิตาเงียบ ห้าแสนคือหนี้ กยศ. ทั้งหมดของเธอ\n\nครึ่งชั่วโมงต่อมา เธอถูกนำตัวโดยรถตู้หน้าต่างดำทึบ มาถึงบ้านหลังใหญ่กลางป่า\n\nบนเตียง — ชายหนุ่มหน้าตาคมสันนอนซีดเซียว บาดแผลกระสุนที่ไหล่ซ้าย เลือดชุ่มผ้าพันแผล\n\nลัลลิตาทำงานอย่างมืออาชีพ ล้างแผล เย็บ พันผ้า มือไม่สั่นแม้หัวใจจะเต้นระรัว\n\nเมื่อเสร็จ เธอลุกขึ้น "เสร็จแล้วค่ะ ฉันขอกลับ"\n\nลูกน้องสองคนยืนขวางประตู\n\n"ขอโทษครับ บอสสั่งว่า...คุณยังกลับไม่ได้"`,
      wordCount: 540, isFree: true, coinPrice: 0, publishedAt: new Date(),
    },
  });
  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel12.id, number: 2 } },
    update: {},
    create: {
      number: 2, title: "สองทางเลือก", novelId: novel12.id, authorId: writer2.id,
      content: `เช้าวันรุ่งขึ้น ลัลลิตาเดินไปเดินมาในห้องที่ถูกขัง — ห้องหรูหราเหมือนโรงแรมห้าดาว แต่หน้าต่างเปิดไม่ได้ ประตูล็อกจากข้างนอก\n\nประตูเปิด ชายที่เธอรักษาเมื่อคืนเดินเข้ามา แขนข้างหนึ่งคล้องผ้า แต่ก้าวเดินมั่นคงราวกับไม่ได้บาดเจ็บ\n\n"ขอบคุณสำหรับเมื่อคืน" เสียงทุ้ม น้ำเสียงสุภาพกว่าที่คิด\n\n"ยินดีค่ะ งั้นปล่อยฉันกลับได้แล้ว"\n\n"ทำไม่ได้" เขานั่งลงเก้าอี้ตรงข้าม จ้องมองเธอ "เธอเห็นที่นี่แล้ว เห็นหน้าคนของผมแล้ว"\n\n"ฉันจะไม่บอกใคร"\n\n"ผมเชื่อเธอ" เขาพูดเรียบๆ "แต่คนอื่นไม่เชื่อ"\n\nลัลลิตากำมือแน่น "แล้วจะให้ฉันทำยังไง?"\n\n"อยู่ที่นี่ เป็นหมอประจำตัวผม จนกว่าผมจะจัดการทุกอย่างเรียบร้อย"\n\n"นานแค่ไหน?"\n\nเขายิ้มบางเบา "ไม่นาน ...อาจจะ"`,
      wordCount: 530, isFree: false, coinPrice: 3, publishedAt: new Date(),
    },
  });

  // --- เรื่อง 13: จอมโจรกับนางฟ้า ---
  const novel13 = await prisma.novel.upsert({
    where: { slug: "jom-john-kap-nang-fah" },
    update: {},
    create: {
      title: "จอมโจรกับนางฟ้า",
      slug: "jom-john-kap-nang-fah",
      synopsis: "แก้วตา ลูกสาวนายพล ถูกลักพาตัวระหว่างเดินทางข้ามประเทศ เธอคิดว่าจะถูกเรียกค่าไถ่ แต่ชายที่จับตัวเธอกลับไม่ได้ต้องการเงิน — เขาต้องการข้อมูลลับจากพ่อเธอ 'ราวัน' จอมโจรข้ามชาติผู้โด่งดัง หน้าหล่อจนน่าหมั่นไส้ วางแผนแยบยล และปฏิบัติกับเชลยเหมือนเจ้าหญิง...",
      status: "ONGOING",
      viewCount: 38900,
      isAdult: true,
      authorId: writer2.id,
      genreId: actionGenre.id,
      tags: { connect: [{ id: tagMafia!.id }, { id: tagBadBoy!.id }, { id: tag18Plus!.id }, { id: tagStrongHeroine!.id }] },
    },
  });

  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel13.id, number: 1 } },
    update: {},
    create: {
      number: 1, title: "เชลยคนสวย", novelId: novel13.id, authorId: writer2.id,
      content: `ถุงคลุมหัวถูกดึงออก แก้วตากะพริบตาปรับแสง\n\nเธออยู่ในห้องขนาดใหญ่ ตกแต่งอย่างหรูหรา มีโซฟาหนัง โต๊ะไม้สัก และ — ชายหนุ่มในเสื้อเชิ้ตสีดำนั่งไขว่ห้างอยู่ตรงข้าม\n\n"สวัสดี คุณแก้วตา" เขายิ้ม รอยยิ้มที่ดูอันตรายมากกว่าเป็นมิตร\n\n"ปล่อยฉัน! รู้ไหมว่าพ่อฉันเป็นใคร!?"\n\n"พลเอกสิริชัย ผู้บัญชาการกองทัพ" เขาตอบทันที "ผมรู้ดี นั่นแหละเหตุผลที่คุณอยู่ที่นี่"\n\nแก้วตากัดริมฝีปาก "คุณต้องการอะไร?"\n\n"ข้อมูลบางอย่าง ที่พ่อคุณซ่อนไว้" เขาลุกขึ้นเดินมาหยุดตรงหน้าเธอ เอียงตัวลง ใบหน้าใกล้จนเธอเห็นสีของดวงตา — สีน้ำตาลอำพัน สวยจนน่ารำคาญ\n\n"ระหว่างรอ ผมจะดูแลคุณอย่างดี สัญญา"\n\n"สัญญาของโจรไม่มีค่า"\n\nเขาหัวเราะ "โอ้ ผมชอบคนมีไฟ"`,
      wordCount: 530, isFree: true, coinPrice: 0, publishedAt: new Date(),
    },
  });

  // --- เรื่อง 14: เลือดเดือด ---
  const novel14 = await prisma.novel.upsert({
    where: { slug: "luead-duead" },
    update: {},
    create: {
      title: "เลือดเดือด",
      slug: "luead-duead",
      synopsis: "ศิลา ลูกชายเจ้าพ่อที่ถูกเลี้ยงมาให้สืบทอดอาณาจักรใต้ดิน กลับตกหลุมรักกับ 'หมอน้ำ' จิตแพทย์สาวที่ถูกส่งมาประเมินสุขภาพจิตเขา เธอเป็นแสงสว่างเดียวในโลกมืดของเขา แต่ศัตรูรอบด้านไม่ยอมให้เขามีจุดอ่อน เมื่อคนที่รักกลายเป็นเป้าหมาย ศิลาต้องเลือกระหว่างบัลลังก์กับหัวใจ...",
      status: "ONGOING",
      viewCount: 44600,
      isAdult: true,
      authorId: writer2.id,
      genreId: actionGenre.id,
      tags: { connect: [{ id: tagMafia!.id }, { id: tagForbidden!.id }, { id: tag18Plus!.id }, { id: tagDrama!.id }] },
    },
  });

  await prisma.chapter.upsert({
    where: { novelId_number: { novelId: novel14.id, number: 1 } },
    update: {},
    create: {
      number: 1, title: "คนไข้พิเศษ", novelId: novel14.id, authorId: writer2.id,
      content: `น้ำใจอ่านแฟ้มประวัติคนไข้ใหม่ — ศิลา อายุ 28 ปี ส่งตัวมาจากศาล เงื่อนไขคุมประพฤติบังคับให้พบจิตแพทย์\n\nข้อหา: ทำร้ายร่างกายสาหัส\n\nเธอถอนหายใจ คนไข้ประเภทนี้มักไม่ให้ความร่วมมือ\n\nประตูเปิด ชายหนุ่มเดินเข้ามา — สูงใหญ่ ผมดำ ดวงตาเข้มราวกับมีเปลวไฟลุกอยู่ข้างใน รอยสักโผล่จากคอเสื้อ ทุกอณูของเขาตะโกนว่า 'อันตราย'\n\nแต่เขานั่งลงเก้าอี้ ไขว่ห้าง แล้วยิ้ม\n\n"สวัสดีครับ หมอ"\n\nเสียงนุ่ม สุภาพ — ตรงข้ามกับรูปลักษณ์โดยสิ้นเชิง\n\nน้ำใจจัดแฟ้มให้เรียบ "สวัสดีค่ะ คุณศิลา วันนี้เราจะเริ่มจากการพูดคุยทำความรู้จักกัน"\n\n"ได้เลยครับ" เขาเอียงศีรษะ "หมอก่อน — ทำไมถึงเลือกเป็นจิตแพทย์?"\n\nน้ำใจกะพริบตา — เป็นครั้งแรกที่คนไข้ถามเธอก่อน\n\nชายคนนี้...ไม่ธรรมดา`,
      wordCount: 550, isFree: true, coinPrice: 0, publishedAt: new Date(),
    },
  });

  console.log("✅ 10 new 18+ romance novels created (4 romantic drama, 3 BL, 3 mafia)");
  console.log("✅ Chapters created for all novels");

  // --- Bookmark example ---
  await prisma.bookmark.upsert({
    where: {
      userId_novelId: { userId: reader.id, novelId: novel1.id },
    },
    update: {},
    create: {
      userId: reader.id,
      novelId: novel1.id,
    },
  });

  await prisma.bookmark.upsert({
    where: {
      userId_novelId: { userId: reader.id, novelId: novel2.id },
    },
    update: {},
    create: {
      userId: reader.id,
      novelId: novel2.id,
    },
  });
  console.log("✅ Bookmarks created");

  // --- Coin transactions ---
  await prisma.coinTransaction.create({
    data: {
      type: "TOPUP",
      amount: 100,
      description: "เติมเหรียญครั้งแรก",
      userId: reader.id,
    },
  });
  console.log("✅ Sample transactions created");

  console.log("\n🎉 Seed completed! Demo accounts:");
  console.log("   Admin:  admin@alyn.co / password123");
  console.log("   Writer: writer@alyn.co / password123");
  console.log("   Reader: reader@alyn.co / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
