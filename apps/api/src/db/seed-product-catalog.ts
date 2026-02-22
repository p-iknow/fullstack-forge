export type SeedProduct = {
  sku: string
  name: string
  brand: string
  description: string
  price: number
  weight: number
  categorySlug: string
  categoryId: string
  isSubstitutable: boolean
  status: 'active' | 'low_stock' | 'out_of_stock' | 'discontinued'
  thumbKey: string
  detailKey: string
}

const skuId = (index: number): string => String(index + 1).padStart(3, '0')

const buildProduct = (
  index: number,
  name: string,
  brand: string,
  description: string,
  price: number,
  weight: number,
  categorySlug: string,
  categoryIndex: number,
): SeedProduct => {
  const id = skuId(index)
  const status: SeedProduct['status'] =
    index % 17 === 0
      ? 'discontinued'
      : index % 9 === 0
        ? 'out_of_stock'
        : index % 6 === 0
          ? 'low_stock'
          : 'active'

  return {
    sku: `SKU-${id}`,
    name,
    brand,
    description,
    price,
    weight,
    categorySlug,
    categoryId: `cat-${categoryIndex}`,
    isSubstitutable: index % 4 !== 0,
    status,
    thumbKey: `sku-${id}-thumb.webp`,
    detailKey: `sku-${id}-detail.webp`,
  }
}

const BASE_PRODUCT_CATALOG: SeedProduct[] = [
  buildProduct(0, '신라면 멀티팩', '농심', '매운맛 라면 5개입', 4480, 600, 'convenience-food', 1),
  buildProduct(1, '즉석밥 햇반 210g', 'CJ제일제당', '백미 즉석밥 3개입', 3980, 630, 'convenience-food', 1),
  buildProduct(2, '동원 참치캔 150g', '동원F&B', '살코기 참치캔', 2500, 150, 'convenience-food', 1),
  buildProduct(3, '짜파게티 멀티팩', '농심', '짜장 볶음면 5개입', 4280, 640, 'convenience-food', 1),
  buildProduct(4, '컵누들 소컵', '오뚜기', '해물맛 컵라면', 1200, 37, 'convenience-food', 1),
  buildProduct(5, '비비고 왕교자', 'CJ제일제당', '냉동만두 350g', 5980, 350, 'convenience-food', 1),
  buildProduct(6, '카레여왕 매콤한맛', '오뚜기', '3분 카레 200g', 2200, 200, 'convenience-food', 1),
  buildProduct(7, '스팸 클래식 200g', 'CJ제일제당', '오리지널 런천미트', 4800, 200, 'convenience-food', 1),

  buildProduct(8, '제주삼다수 2L', '제주삼다수', '제주 화산암반수', 1200, 2000, 'beverage', 2),
  buildProduct(9, '코카콜라 500ml', '코카콜라', '오리지널 탄산음료', 1800, 500, 'beverage', 2),
  buildProduct(10, '스타벅스 콜드브루', '스타벅스', '아메리카노 275ml', 2800, 275, 'beverage', 2),
  buildProduct(11, '비타500 100ml', '광동제약', '비타민C 음료 10병', 6500, 1000, 'beverage', 2),
  buildProduct(12, '포카리스웨트 500ml', '동아오츠카', '이온 음료', 1500, 500, 'beverage', 2),
  buildProduct(13, '밀키스 250ml', '롯데칠성', '탄산유성음료 6캔', 4800, 1500, 'beverage', 2),
  buildProduct(14, '토레타 500ml', '코카콜라', '수분충전 음료', 1600, 500, 'beverage', 2),
  buildProduct(15, '칠성사이다 500ml', '롯데칠성', '천연 레몬라임 탄산', 1400, 500, 'beverage', 2),

  buildProduct(16, '미용티슈 200매', '깨끗한나라', '3겹 순수 티슈 3박스', 5900, 600, 'hygiene', 3),
  buildProduct(17, '아이깨끗해 핸드워시', '라이온', '250ml 리필', 3200, 250, 'hygiene', 3),
  buildProduct(18, 'KF94 마스크 10매', '웰킵스', '대형 황사방역용', 9900, 60, 'hygiene', 3),
  buildProduct(19, '물티슈 100매', '깨끗한나라', '캡형 저자극 물티슈', 2800, 400, 'hygiene', 3),
  buildProduct(20, '메디안 치약 120g', '아모레퍼시픽', '잇몸과학 치약', 3500, 120, 'hygiene', 3),
  buildProduct(21, '오랄비 칫솔 3입', '오랄비', '크로스액션 중모', 7900, 45, 'hygiene', 3),
  buildProduct(22, '질레트 면도기', '질레트', '퓨전5 프로글라이드 면도기', 12900, 30, 'hygiene', 3),
  buildProduct(23, '핸디큐어 손소독제', '핸디큐어', '500ml 펌프형', 5500, 500, 'hygiene', 3),

  buildProduct(24, '피죤 액체세제 2.5L', '피죤', '프리미엄 고농축 세탁세제', 11900, 2500, 'laundry-cleaning', 4),
  buildProduct(25, '다우니 섬유유연제 1L', '다우니', '어도러블 향 유연제', 8900, 1000, 'laundry-cleaning', 4),
  buildProduct(26, '옥시크린 1kg', '옥시', '만능 산소계 표백제', 7500, 1000, 'laundry-cleaning', 4),
  buildProduct(27, '매직블럭 3입', '슈퍼크린', '다목적 클리너 스펀지', 3200, 60, 'laundry-cleaning', 4),
  buildProduct(28, '퐁퐁 주방세제 500ml', '애경', '레몬향 주방세제', 2900, 500, 'laundry-cleaning', 4),
  buildProduct(29, '유한락스 1L', '유한양행', '살균소독 표백제', 3800, 1000, 'laundry-cleaning', 4),
  buildProduct(30, '쓱삭 청소포 30매', '쓱삭', '물걸레 청소포 대형', 4500, 500, 'laundry-cleaning', 4),
  buildProduct(31, '페브리즈 방향제', 'P&G', '화이트 티 섬유탈취제 370ml', 6900, 370, 'laundry-cleaning', 4),

  buildProduct(32, '하림 더리얼 닭가슴살', '하림', '반려견 사료 1.5kg', 18900, 1500, 'pet-supplies', 5),
  buildProduct(33, '위스카스 참치캔 400g', '위스카스', '고양이 습식 사료', 3200, 400, 'pet-supplies', 5),
  buildProduct(34, '져키빌 닭가슴살', '져키', '강아지 간식 100g', 4500, 100, 'pet-supplies', 5),
  buildProduct(35, '에버크린 고양이모래', '에버크린', '무향 응고형 6L', 15900, 5000, 'pet-supplies', 5),
  buildProduct(36, '깨끗이 반려견패드', '깨끗이', '초대형 배변패드 40매', 12500, 800, 'pet-supplies', 5),
  buildProduct(37, '이나바 츄르 20본', '이나바', '참치 고양이 츄르 세트', 8900, 280, 'pet-supplies', 5),
  buildProduct(38, '탐앤탐스 강아지샴푸', '탐앤탐스', '저자극 펫샴푸 500ml', 11900, 500, 'pet-supplies', 5),
  buildProduct(39, '캣닢볼 장난감', '캣닢볼', '고양이 캣닢 공 3개입', 5500, 45, 'pet-supplies', 5),

  buildProduct(40, '이니스프리 선크림', '이니스프리', 'SPF50+ 데일리선 50ml', 12900, 50, 'self-care', 6),
  buildProduct(41, '라네즈 수분크림 50ml', '라네즈', '워터뱅크 블루 히알루로닉 크림', 28900, 50, 'self-care', 6),
  buildProduct(42, '미장센 헤어에센스', '미장센', '퍼펙트 세럼 80ml', 8900, 80, 'self-care', 6),
  buildProduct(43, '고려은단 비타민C', '고려은단', '1000mg 120정', 15900, 150, 'self-care', 6),
  buildProduct(44, '바세린 립밤', '바세린', '오리지널 립테라피 7g', 4500, 7, 'self-care', 6),
  buildProduct(45, '메디힐 마스크팩 10매', '메디힐', 'N.M.F 아쿠아링 앰플 마스크', 9900, 250, 'self-care', 6),
  buildProduct(46, '세타필 바디로션 473ml', '세타필', '모이스처라이징 로션', 16900, 473, 'self-care', 6),
  buildProduct(47, '록시땅 핸드크림 30ml', '록시땅', '시어버터 핸드크림', 12000, 30, 'self-care', 6),

  buildProduct(48, '오뚜기 진라면 순한맛', '오뚜기', '순한맛 라면 5개입', 4180, 600, 'convenience-food', 1),
  buildProduct(49, '햇반 흑미밥 210g', 'CJ제일제당', '흑미 혼합 즉석밥 3개입', 4680, 630, 'convenience-food', 1),
  buildProduct(50, '샘표 국간장 500ml', '샘표', '요리용 국간장', 5900, 500, 'convenience-food', 1),
  buildProduct(51, '오뚜기 3분 미트볼', '오뚜기', '레토르트 미트볼 150g', 3200, 150, 'convenience-food', 1),
  buildProduct(52, '양반 즉석죽 전복', '동원', '전복죽 285g', 4200, 285, 'convenience-food', 1),
  buildProduct(53, '백설 파스타면 500g', 'CJ제일제당', '스파게티면', 2600, 500, 'convenience-food', 1),

  buildProduct(54, '델몬트 오렌지주스 1.5L', '델몬트', '오렌지 100% 주스', 5200, 1500, 'beverage', 2),
  buildProduct(55, '게토레이 레몬 600ml', '롯데칠성', '스포츠 음료', 1700, 600, 'beverage', 2),
  buildProduct(56, '웅진 하늘보리 500ml', '웅진', '보리차 음료', 1300, 500, 'beverage', 2),
  buildProduct(57, '립톤 아이스티 복숭아 500ml', '롯데칠성', '복숭아 아이스티', 1600, 500, 'beverage', 2),
  buildProduct(58, '트레비 라임 500ml', '롯데칠성', '탄산수 라임향', 1400, 500, 'beverage', 2),
  buildProduct(59, '매일두유 190ml 6팩', '매일', '고단백 두유', 7800, 1140, 'beverage', 2),

  buildProduct(60, '바디피트 생리대 중형', '바디피트', '날개형 18매', 6900, 300, 'hygiene', 3),
  buildProduct(61, '크리넥스 키친타월 6롤', '크리넥스', '흡수력 강화 키친타월', 7900, 1200, 'hygiene', 3),
  buildProduct(62, '니베아 립케어', '니베아', '보습 립밤 4.8g', 4900, 5, 'hygiene', 3),
  buildProduct(63, '리스테린 쿨민트 750ml', '리스테린', '구강청결제', 10900, 750, 'hygiene', 3),
  buildProduct(64, '잘풀리는집 화장지 30롤', '잘풀리는집', '3겹 데일리 화장지', 18900, 4200, 'hygiene', 3),
  buildProduct(65, '휴족시간 쿨링시트', '휴족시간', '다리 피로 케어 6매', 6500, 120, 'hygiene', 3),

  buildProduct(66, '테크 액체세제 3L', 'LG생활건강', '드럼/일반 겸용', 12900, 3000, 'laundry-cleaning', 4),
  buildProduct(67, '샤프란 섬유유연제 1.6L', 'LG생활건강', '코튼향 유연제', 8900, 1600, 'laundry-cleaning', 4),
  buildProduct(68, '홈스타 욕실세정제', '홈스타', '곰팡이 제거 스프레이', 5900, 750, 'laundry-cleaning', 4),
  buildProduct(69, '락앤락 고무장갑 중형', '락앤락', '주방용 고무장갑', 3200, 80, 'laundry-cleaning', 4),
  buildProduct(70, '스카트 빨아쓰는 행주', '스카트', '다회용 행주 45매', 9800, 450, 'laundry-cleaning', 4),
  buildProduct(71, '유한젠 표백제 1kg', '유한양행', '산소계 표백제', 7200, 1000, 'laundry-cleaning', 4),

  buildProduct(72, '로얄캐닌 인도어 2kg', '로얄캐닌', '실내용 고양이 사료', 36900, 2000, 'pet-supplies', 5),
  buildProduct(73, '네츄럴코어 연어사료 1.2kg', '네츄럴코어', '그레인프리 강아지사료', 24900, 1200, 'pet-supplies', 5),
  buildProduct(74, '펫츠루트 치카껌 7개입', '펫츠루트', '덴탈 케어 간식', 5900, 210, 'pet-supplies', 5),
  buildProduct(75, '펫모닝 스크래쳐', '펫모닝', '골판지 스크래쳐', 7900, 650, 'pet-supplies', 5),
  buildProduct(76, '하겐 캣토이 낚싯대', '하겐', '고양이 장난감', 6900, 120, 'pet-supplies', 5),
  buildProduct(77, '펫크린 탈취제 500ml', '펫크린', '반려동물 냄새 제거', 8500, 500, 'pet-supplies', 5),

  buildProduct(78, '아벤느 미스트 150ml', '아벤느', '진정 보습 미스트', 14900, 150, 'self-care', 6),
  buildProduct(79, '닥터지 수딩크림 70ml', '닥터지', '민감 피부 진정 크림', 18900, 70, 'self-care', 6),
  buildProduct(80, 'TS 샴푸 500g', 'TS', '두피 케어 샴푸', 16900, 500, 'self-care', 6),
  buildProduct(81, '센트룸 멀티비타민 90정', '센트룸', '종합비타민', 25900, 200, 'self-care', 6),
  buildProduct(82, '아이오페 맨 올데이 로션', '아이오페', '남성 보습 로션 120ml', 23900, 120, 'self-care', 6),
  buildProduct(83, '뉴트리원 루테인 60캡슐', '뉴트리원', '눈 건강 영양제', 19900, 150, 'self-care', 6),
]

type ExpansionTheme = {
  categorySlug: string
  categoryIndex: number
  brands: string[]
  nouns: string[]
  forms: string[]
  basePrice: number
  priceStep: number
  baseWeight: number
  weightStep: number
}

const EXPANSION_PRODUCTS_PER_CATEGORY = 36

const EXPANSION_THEMES: ExpansionTheme[] = [
  {
    categorySlug: 'convenience-food',
    categoryIndex: 1,
    brands: ['오뚜기', '농심', 'CJ제일제당', '동원', '샘표', '대상'],
    nouns: ['즉석국', '컵밥', '소스', '냉동덮밥', '파스타소스', '레토르트'],
    forms: ['기본형', '매콤형', '순한형', '대용량', '1인분', '가정형'],
    basePrice: 2900,
    priceStep: 350,
    baseWeight: 220,
    weightStep: 35,
  },
  {
    categorySlug: 'beverage',
    categoryIndex: 2,
    brands: ['코카콜라', '롯데칠성', '동아오츠카', '웅진', '광동제약', '매일'],
    nouns: ['탄산음료', '이온음료', '과채주스', '보리차', '두유', '스파클링워터'],
    forms: ['330ml', '500ml', '600ml', '1L', '1.5L', '6팩'],
    basePrice: 1400,
    priceStep: 250,
    baseWeight: 330,
    weightStep: 80,
  },
  {
    categorySlug: 'hygiene',
    categoryIndex: 3,
    brands: ['깨끗한나라', '크리넥스', '니베아', '리스테린', '웰킵스', '아모레퍼시픽'],
    nouns: ['화장지', '핸드워시', '치약', '마스크', '구강청결제', '물티슈'],
    forms: ['패밀리팩', '휴대형', '리필형', '대용량', '민감형', '데일리형'],
    basePrice: 3500,
    priceStep: 500,
    baseWeight: 120,
    weightStep: 55,
  },
  {
    categorySlug: 'laundry-cleaning',
    categoryIndex: 4,
    brands: ['LG생활건강', '유한양행', '피죤', '다우니', '홈스타', '애경'],
    nouns: ['세탁세제', '섬유유연제', '욕실세정제', '주방세제', '표백제', '청소포'],
    forms: ['표준형', '리필형', '고농축형', '대용량', '무향형', '향기형'],
    basePrice: 4800,
    priceStep: 600,
    baseWeight: 450,
    weightStep: 130,
  },
  {
    categorySlug: 'pet-supplies',
    categoryIndex: 5,
    brands: ['로얄캐닌', '네츄럴코어', '하림', '위스카스', '펫모닝', '이나바'],
    nouns: ['사료', '간식', '모래', '패드', '샴푸', '장난감'],
    forms: ['고양이용', '강아지용', '실내용', '데일리형', '영양형', '대용량'],
    basePrice: 6200,
    priceStep: 900,
    baseWeight: 180,
    weightStep: 160,
  },
  {
    categorySlug: 'self-care',
    categoryIndex: 6,
    brands: ['이니스프리', '라네즈', '닥터지', '센트룸', '세타필', '아이오페'],
    nouns: ['크림', '에센스', '선케어', '비타민', '로션', '마스크팩'],
    forms: ['보습형', '진정형', '탄력형', '데일리형', '집중형', '프리미엄'],
    basePrice: 8900,
    priceStep: 700,
    baseWeight: 50,
    weightStep: 22,
  },
]

const buildExpansionProducts = (startIndex: number): SeedProduct[] => {
  const expandedProducts: SeedProduct[] = []
  let productIndex = startIndex

  for (const theme of EXPANSION_THEMES) {
    for (let i = 0; i < EXPANSION_PRODUCTS_PER_CATEGORY; i++) {
      const brand = theme.brands[i % theme.brands.length]!
      const noun = theme.nouns[i % theme.nouns.length]!
      const form = theme.forms[Math.floor(i / theme.nouns.length) % theme.forms.length]!
      const variant = String(i + 1).padStart(2, '0')
      const name = `${brand} ${noun} ${form} ${variant}`
      const description = `${theme.categorySlug} 테마 목데이터 상품 ${variant}`
      const price = theme.basePrice + (i % 10) * theme.priceStep
      const weight = theme.baseWeight + (i % 8) * theme.weightStep

      expandedProducts.push(
        buildProduct(
          productIndex,
          name,
          brand,
          description,
          price,
          weight,
          theme.categorySlug,
          theme.categoryIndex,
        ),
      )

      productIndex += 1
    }
  }

  return expandedProducts
}

export const PRODUCT_CATALOG: SeedProduct[] = [
  ...BASE_PRODUCT_CATALOG,
  ...buildExpansionProducts(BASE_PRODUCT_CATALOG.length),
]
