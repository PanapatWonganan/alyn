import 'package:flutter/material.dart';
import 'models.dart';

/// Mirrors data.jsx GENRES.
const List<Genre> kGenres = [
  Genre(id: 'romance', name: 'โรมานซ์', en: 'Romance', color: Color(0xFFCB8A7C), icon: '♡'),
  Genre(id: 'fantasy', name: 'แฟนตาซี', en: 'Fantasy', color: Color(0xFF9D5E55), icon: '✦'),
  Genre(id: 'drama', name: 'ดราม่า', en: 'Drama', color: Color(0xFF7E5E4E), icon: '◐'),
  Genre(id: 'mystery', name: 'ลึกลับ', en: 'Mystery', color: Color(0xFF1E3A0D), icon: '◈'),
  Genre(id: 'horror', name: 'สยองขวัญ', en: 'Horror', color: Color(0xFF3A1F1A), icon: '◉'),
  Genre(id: 'historical', name: 'ย้อนยุค', en: 'Historical', color: Color(0xFFB88E4A), icon: '❊'),
];

/// Mirrors data.jsx BOOKS.
final List<Book> kBooks = [
  Book(
    id: 'moonlight',
    title: 'ใต้แสงจันทร์ดวงเดิม',
    subtitle: 'Under the Same Moon',
    author: 'พิมพ์ชนก วรรณกุล',
    authorHandle: '@pim_writes',
    genre: 'romance',
    rating: 4.9,
    reads: '2.4M',
    chapters: 87,
    status: 'กำลังเขียน',
    mood: const ['อบอุ่น', 'หวานละมุน', 'เยียวยา'],
    cover: const BookCoverSpec(
      base: Color(0xFFE8C3B8),
      accent: Color(0xFF9D5E55),
      glyph: '☾',
    ),
    description:
        'เรื่องราวของสาวนักอ่านผู้บังเอิญหลงเข้าไปในโลกของนิยายที่ตนเองรัก '
        'และได้พบกับชายหนุ่มปริศนาที่เฝ้ารอเธอมาทั้งชาติ '
        'ใต้แสงจันทร์ดวงเดิมที่ส่องทางทั้งสองโลก',
    chapterTitles: const [
      'บทที่ 1 — จุดเริ่มต้นใต้แสงจันทร์',
      'บทที่ 2 — เสียงที่คุ้นเคย',
      'บทที่ 3 — หน้ากระดาษที่ขาดหาย',
    ],
    excerpt:
        'แสงจันทร์ส่องผ่านหน้าต่างห้องสมุดเก่า อลินพลิกหน้ากระดาษที่เหลืองกรอบอย่างระมัดระวัง '
        'เสียงลมพัดใบไม้ข้างนอกกลายเป็นเสียงกระซิบที่เธอไม่เคยได้ยินมาก่อน — '
        '"ในที่สุดเธอก็กลับมาแล้ว"\n\n'
        'เธอเงยหน้าขึ้น ความเย็นแวบหนึ่งไหลผ่านหลังคอ '
        'แต่ห้องนี้ไม่มีใครนอกจากเธอ หนังสือเล่มเดิมที่อ่านมาตั้งแต่เด็กถูกวางไว้บนโต๊ะ '
        'หน้าปกสีม่วงเข้มพร้อมภาพจันทร์เสี้ยวที่คุ้นตา\n\n'
        'แต่คืนนี้ ตัวอักษรบนหน้ากระดาษดูเหมือนจะขยับได้...',
  ),
  const Book(
    id: 'dragon',
    title: 'มังกรเงินในใจข้าฯ',
    subtitle: 'The Silver Dragon',
    author: 'ณิชชา อรุโณทัย',
    authorHandle: '@nicha_arun',
    genre: 'fantasy',
    rating: 4.8,
    reads: '1.8M',
    chapters: 124,
    status: 'จบแล้ว',
    mood: ['ผจญภัย', 'มหากาพย์', 'มนตร์ดำ'],
    cover: BookCoverSpec(
      base: Color(0xFF9D5E55),
      accent: Color(0xFFF3DCD4),
      glyph: '✦',
    ),
    description:
        'องค์หญิงแห่งอาณาจักรที่ล่มสลาย ต้องเดินทางตามหามังกรเงินในตำนาน '
        'สิ่งเดียวที่จะปลดผนึกคำสาปของราชวงศ์ แต่ราคาของอิสรภาพ '
        'อาจเป็นหัวใจของเธอเอง',
  ),
  const Book(
    id: 'classroom',
    title: 'ห้องเรียนคนเดียว',
    subtitle: 'The Empty Classroom',
    author: 'ภูริช สรวิทย์',
    authorHandle: '@phurich',
    genre: 'horror',
    rating: 4.7,
    reads: '980K',
    chapters: 42,
    status: 'กำลังเขียน',
    mood: ['หลอน', 'ค่อยๆคืบ', 'สยองจิตวิทยา'],
    cover: BookCoverSpec(
      base: Color(0xFF3A1F1A),
      accent: Color(0xFFCB8A7C),
      glyph: '◉',
    ),
    description:
        'โรงเรียนเก่าแก่ที่ปิดตัวลงเมื่อ 30 ปีก่อน '
        'นักศึกษาสถาปัตย์คนหนึ่งอาสาเข้าสำรวจอาคารเพื่อทำวิทยานิพนธ์ '
        'แต่เธอไม่ได้อยู่คนเดียว',
  ),
  const Book(
    id: 'coffee',
    title: 'กาแฟ นก และบ่ายวันพุธ',
    subtitle: 'Coffee, Birds and Wednesday',
    author: 'อรอินทุ์ ใจเย็น',
    authorHandle: '@orain',
    genre: 'drama',
    rating: 4.6,
    reads: '1.2M',
    chapters: 56,
    status: 'กำลังเขียน',
    mood: ['สบาย', 'เยียวยา', 'ช้าๆ'],
    cover: BookCoverSpec(
      base: Color(0xFFF3DCD4),
      accent: Color(0xFF9D5E55),
      glyph: '◐',
    ),
    description:
        'ร้านกาแฟเล็กๆ ในซอยเงียบ ที่ซึ่งคนแปลกหน้าเดินเข้ามาและกลายเป็นเพื่อน '
        'เรื่องเล่าที่ไม่มีจุดจบที่ยิ่งใหญ่ แค่ชีวิตที่ใครบางคนต้องใช้อยู่',
  ),
  const Book(
    id: 'palace',
    title: 'ดาวประดับราชสำนัก',
    subtitle: 'Star of the Palace',
    author: 'กฤตยา วิไลเลิศ',
    authorHandle: '@krittaya_w',
    genre: 'historical',
    rating: 4.9,
    reads: '3.1M',
    chapters: 198,
    status: 'กำลังเขียน',
    mood: ['ย้อนยุค', 'ราชสำนัก', 'เข้มข้น'],
    cover: BookCoverSpec(
      base: Color(0xFFB88E4A),
      accent: Color(0xFF1F1715),
      glyph: '❊',
    ),
    description:
        'หญิงสาวจากตระกูลธรรมดาต้องเข้าวังหลวงในฐานะนางกำนัล '
        'เพื่อสืบหาความจริงเบื้องหลังการตายของพี่สาว '
        'ในแดนที่ก้าวพลาดครั้งเดียวอาจต้องใช้ชีวิตเป็นเดิมพัน',
  ),
  const Book(
    id: 'signal',
    title: 'สัญญาณจากดาวที่ไม่มีอยู่',
    subtitle: "Signal from a Star that Doesn't Exist",
    author: 'ธนภัทร วิสุทธิกุล',
    authorHandle: '@thanapat_v',
    genre: 'mystery',
    rating: 4.5,
    reads: '540K',
    chapters: 28,
    status: 'กำลังเขียน',
    mood: ['ลึกลับ', 'ไซไฟ', 'ปรัชญา'],
    cover: BookCoverSpec(
      base: Color(0xFF1E3A0D),
      accent: Color(0xFFE8C3B8),
      glyph: '◈',
    ),
    description:
        'นักดาราศาสตร์หญิงรับสัญญาณวิทยุจากพิกัดที่ไม่มีดาวฤกษ์อยู่ '
        'เมื่อเธอถอดรหัสสำเร็จ สิ่งที่เธอพบคือข้อความที่เขียนด้วยลายมือของตัวเธอเองในอนาคต',
  ),
  const Book(
    id: 'bakery',
    title: 'ร้านขนมของนางฟ้าที่ตกงาน',
    subtitle: "The Unemployed Fairy's Bakery",
    author: 'ปาลิตา บุญมี',
    authorHandle: '@palita',
    genre: 'fantasy',
    rating: 4.8,
    reads: '760K',
    chapters: 35,
    status: 'กำลังเขียน',
    mood: ['หวาน', 'cozy', 'มายากล'],
    cover: BookCoverSpec(
      base: Color(0xFFF3DCD4),
      accent: Color(0xFFB88E4A),
      glyph: '✧',
    ),
    description:
        'นางฟ้าที่ถูกไล่ออกจากสวรรค์เพราะใช้เวทมนตร์ทำขนม '
        'เปิดร้านเบเกอรี่เล็กๆ ในกรุงเทพฯ '
        'ที่ลูกค้าแต่ละคนมีความปรารถนาที่ขนมเพียงชิ้นเดียวอาจเปลี่ยนแปลงได้',
  ),
  const Book(
    id: 'letter',
    title: 'จดหมายที่ไม่ได้ส่ง',
    subtitle: 'Letters Never Sent',
    author: 'ศุภิสรา จันทร์แจ่ม',
    authorHandle: '@supisara_j',
    genre: 'romance',
    rating: 4.7,
    reads: '1.6M',
    chapters: 72,
    status: 'จบแล้ว',
    mood: ['หวานปนเศร้า', 'โหยหา', 'น้ำตา'],
    cover: BookCoverSpec(
      base: Color(0xFF9D5E55),
      accent: Color(0xFFFFF4F1),
      glyph: '✉',
    ),
    description:
        'กล่องจดหมายเก่าในห้องคุณยาย จดหมาย 147 ฉบับที่ไม่เคยถูกส่งออกไป '
        'เปิดประตูสู่ความรักหนึ่งเดียวในชีวิตที่ถูกซ่อนไว้นานกว่าครึ่งศตวรรษ',
  ),
];

const List<Review> kReviews = [
  Review(
    user: 'มินท์',
    avatar: Color(0xFFCB8A7C),
    rating: 5,
    text: 'อ่านจบในคืนเดียว น้ำตาไหลตลอดบทที่ 40 พี่พิมพ์เขียนดีมากกก',
    time: '2 ชม. ที่แล้ว',
  ),
  Review(
    user: 'ปราง',
    avatar: Color(0xFF9D5E55),
    rating: 5,
    text: 'โลกของเรื่องนี้ทำให้รู้สึกเหมือนได้หลบหนีไปจริงๆ ขอบคุณนักเขียนที่เขียนเรื่องดีๆ ให้อ่านค่ะ',
    time: '1 วัน',
  ),
  Review(
    user: 'ฟ้าใส',
    avatar: Color(0xFFB88E4A),
    rating: 4,
    text: 'พล็อตดี ตัวละครมีมิติ รอบทใหม่ด้วยใจจดจ่อ',
    time: '3 วัน',
  ),
];
