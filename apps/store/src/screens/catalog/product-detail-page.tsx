import { useQuery } from "@tanstack/react-query";
import { catalogDetailQueryOptions } from "~/lib/queries/catalog";
import { CatalogTopNav } from "~/screens/catalog/catalog-top-nav";

const formatPrice = (price: number) =>
  `${new Intl.NumberFormat("ko-KR").format(price)}원`;

export function ProductDetailPage({
  productId,
}: Readonly<{ productId: string }>) {
  const productQuery = useQuery(catalogDetailQueryOptions(productId));

  if (productQuery.isPending) {
    return (
      <p className="p-6 text-sm text-slate-500">상품 상세를 불러오는 중...</p>
    );
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <p className="p-6 text-sm text-rose-700">
        상품 정보를 불러오지 못했습니다.
      </p>
    );
  }

  const product = productQuery.data;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <CatalogTopNav />

      <a href="/" className="text-sm underline">
        상품 목록으로 돌아가기
      </a>

      <section className="mt-4 grid gap-6 rounded-xl border border-slate-200 bg-white p-6 md:grid-cols-2">
        <div>
          <img
            src={product.detailUrl}
            alt={`${product.name} 이미지`}
            loading="lazy"
            className="aspect-square w-full rounded-lg bg-slate-100 object-cover"
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-500">{product.categoryName}</p>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-sm text-slate-600">브랜드: {product.brand}</p>
          <p className="text-lg font-semibold">{formatPrice(product.price)}</p>
          <p className="text-sm text-slate-600">중량: {product.weight}g</p>
          <p className="text-sm text-slate-600">상태: {product.status}</p>
          <p className="text-sm text-slate-600">
            가용 재고: {product.availableStock}개
          </p>
          <p className="text-sm text-slate-700">{product.description}</p>

          {!product.canPurchase ? (
            <p className="rounded bg-rose-100 p-3 text-sm text-rose-700">
              {product.status === "discontinued"
                ? "단종 상품으로 신규 구매가 불가합니다."
                : "품절 상태로 구매가 불가합니다."}
            </p>
          ) : (
            <p className="rounded bg-emerald-100 p-3 text-sm text-emerald-700">
              구매 가능한 상품입니다.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
