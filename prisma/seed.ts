// بيانات البداية — TEST DATA — NOT FOR PRODUCTION
// §58: لا نخترع أي رواية. هذه بيانات هيكلية لاختبار المحرك فقط،
// وستُستبدل بمحتوى موثّق يُدخله المشرفون عبر لوحة الإدارة.
// كل الأسئلة تبقى في حالة DRAFT — لن تدخل اللعبة أبدًا قبل التحقق البشري.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // الدول (مختارة للبدء — التطبيق الكامل يضم القائمة الكاملة)
  const countries = [
    { code: "SA", nameEn: "Saudi Arabia", nameAr: "السعودية" },
    { code: "IQ", nameEn: "Iraq", nameAr: "العراق" },
    { code: "IR", nameEn: "Iran", nameAr: "إيران" },
    { code: "LB", nameEn: "Lebanon", nameAr: "لبنان" },
    { code: "BH", nameEn: "Bahrain", nameAr: "البحرين" },
    { code: "KW", nameEn: "Kuwait", nameAr: "الكويت" },
    { code: "SY", nameEn: "Syria", nameAr: "سوريا" },
    { code: "YE", nameEn: "Yemen", nameAr: "اليمن" },
    { code: "EG", nameEn: "Egypt", nameAr: "مصر" },
    { code: "JO", nameEn: "Jordan", nameAr: "الأردن" },
    { code: "AE", nameEn: "United Arab Emirates", nameAr: "الإمارات" },
    { code: "QA", nameEn: "Qatar", nameAr: "قطر" },
    { code: "OM", nameEn: "Oman", nameAr: "عُمان" },
    { code: "MA", nameEn: "Morocco", nameAr: "المغرب" },
    { code: "DZ", nameEn: "Algeria", nameAr: "الجزائر" },
    { code: "TN", nameEn: "Tunisia", nameAr: "تونس" },
    { code: "LY", nameEn: "Libya", nameAr: "ليبيا" },
    { code: "SD", nameEn: "Sudan", nameAr: "السودان" },
    { code: "PK", nameEn: "Pakistan", nameAr: "باكستان" },
    { code: "IN", nameEn: "India", nameAr: "الهند" },
    { code: "AF", nameEn: "Afghanistan", nameAr: "أفغانستان" },
    { code: "TR", nameEn: "Turkey", nameAr: "تركيا" },
    { code: "US", nameEn: "United States", nameAr: "الولايات المتحدة" },
    { code: "GB", nameEn: "United Kingdom", nameAr: "المملكة المتحدة" },
    { code: "CA", nameEn: "Canada", nameAr: "كندا" },
    { code: "DE", nameEn: "Germany", nameAr: "ألمانيا" },
    { code: "SE", nameEn: "Sweden", nameAr: "السويد" },
    { code: "AU", nameEn: "Australia", nameAr: "أستراليا" },
    { code: "MY", nameEn: "Malaysia", nameAr: "ماليزيا" },
    { code: "ID", nameEn: "Indonesia", nameAr: "إندونيسيا" },
  ];

  for (const c of countries) {
    await prisma.country.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  // الكتب — عنوان الكتاب موثق، بدون أي روايات مخترعة
  const alKafi = await prisma.book.upsert({
    where: { id: "book-al-kafi" },
    update: {},
    create: {
      id: "book-al-kafi",
      titleAr: "الكافي",
      titleEn: "Al-Kafi",
      authorAr: "ثقة الإسلام محمد بن يعقوب الكليني",
    },
  });

  const basair = await prisma.book.upsert({
    where: { id: "book-basair" },
    update: {},
    create: {
      id: "book-basair",
      titleAr: "بصائر الدرجات",
      titleEn: "Basair al-Darajat",
      authorAr: "الشيخ أبو جعفر محمد بن الحسن الصفار",
    },
  });

  // طبعات مرجعية (بدون أرقام صفحات مخترعة — تُستكمل عند التوثيق)
  const kafiEdition = await prisma.edition.upsert({
    where: { id: "edition-kafi-default" },
    update: {},
    create: {
      id: "edition-kafi-default",
      bookId: alKafi.id,
      titleAr: "طبعة دار الكتب الإسلامية — طهران",
      citation: "TEST DATA — NOT FOR PRODUCTION",
    },
  });

  const basairEdition = await prisma.edition.upsert({
    where: { id: "edition-basair-default" },
    update: {},
    create: {
      id: "edition-basair-default",
      bookId: basair.id,
      titleAr: "طبعة الأعلمي — قم",
      citation: "TEST DATA — NOT FOR PRODUCTION",
    },
  });

  console.log("✔ تم إدخال الدول والكتب والطبعات (بيانات هيكلية فقط)");
  console.warn("⚠ لا توجد روايات أو أسئلة — يجب إدخالها وتوثيقها عبر لوحة الإدارة قبل النشر");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
