/**
 * 상품/가격 정의. 가격은 정수(원)로 저장한다.
 * 이 목록이 Product 시드의 원본(source of truth)이며, DB Product 로 seed 된다.
 * 클라이언트가 보낸 금액은 절대 신뢰하지 않고 서버에서 이 값으로 재검증한다.
 */

export type ProductId = "single" | "pack2" | "pack7" | "pack12";

export interface ProductDef {
  id: ProductId;
  /** 화면 표기명 */
  name: string;
  /** 결제 금액(원, 정수) */
  amount: number;
  /** 지급되는 열람 횟수(크레딧) */
  credits: number;
  /** 활성화 여부 */
  active: boolean;
  description: string;
}

const enableCreditPacks = process.env.ENABLE_CREDIT_PACKS === "true";

export const products: ProductDef[] = [
  {
    id: "single",
    name: "전체 리포트 (1인 1회)",
    amount: 550,
    credits: 1,
    active: true,
    description: "사주 × 서양점성술 종합 리포트 1건 열람 + PDF 다운로드",
  },
  {
    id: "pack2",
    name: "2회 이용권",
    amount: 1100,
    credits: 2,
    active: enableCreditPacks,
    description: "종합 리포트 2건 열람권",
  },
  {
    id: "pack7",
    name: "7회 이용권",
    amount: 3300,
    credits: 7,
    active: enableCreditPacks,
    description: "종합 리포트 7건 열람권",
  },
  {
    id: "pack12",
    name: "12회 이용권",
    amount: 5500,
    credits: 12,
    active: enableCreditPacks,
    description: "종합 리포트 12건 열람권",
  },
];

export const PRIMARY_PRODUCT_ID: ProductId = "single";

export function getProduct(id: string): ProductDef | undefined {
  return products.find((p) => p.id === id && p.active);
}

export function getPrimaryProduct(): ProductDef {
  const p = getProduct(PRIMARY_PRODUCT_ID);
  if (!p) throw new Error("Primary product is not active");
  return p;
}
