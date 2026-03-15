import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@fullstack-forge/design-system/components/button'
import { Card, CardContent } from '@fullstack-forge/design-system/components/card'
import { Input } from '@fullstack-forge/design-system/components/input'
import { Label } from '@fullstack-forge/design-system/components/label'
import { Textarea } from '@fullstack-forge/design-system/components/textarea'
import {
  adminCategoriesQueryOptions,
  adminProductQueryOptions,
  updateProductMutationOptions,
  uploadProductImagesMutationOptions,
} from '~/@shared/queries/catalog'
import { readApiError } from '~/@shared/api/core'
import { useEffect, useRef, useState } from 'react'

const productSchema = z.object({
  name: z.string().min(1, '상품명을 입력해주세요'),
  description: z.string().min(1, '상품 설명을 입력해주세요'),
  price: z.coerce.number().int().positive('가격은 0보다 커야 합니다'),
  categoryId: z.string().uuid('카테고리를 선택해주세요'),
  isSubstitutable: z.boolean().default(false),
})

type ProductFormValues = z.input<typeof productSchema>

export function ProductEditPage() {
  const { id } = useParams({ from: '/products/$id/edit' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const productQuery = useQuery(adminProductQueryOptions(id))
  const categoriesQuery = useQuery(adminCategoriesQueryOptions())

  const updateMutation = useMutation(updateProductMutationOptions(queryClient))
  const uploadMutation = useMutation(uploadProductImagesMutationOptions(queryClient))

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      categoryId: '',
      isSubstitutable: false,
    },
  })
  useEffect(() => {
    if (productQuery.data) {
      form.reset({
        name: productQuery.data.name,
        description: productQuery.data.description,
        price: productQuery.data.price,
        categoryId: productQuery.data.categoryId || '',
        isSubstitutable: productQuery.data.isSubstitutable,
      })
    }
  }, [productQuery.data, form])

  const onSubmit = async (data: ProductFormValues) => {
    setErrorMsg(null)
    try {
      await updateMutation.mutateAsync({ id, data: data as z.infer<typeof productSchema> })
      navigate({ to: '/' })
    } catch (error) {
      const apiError = await readApiError(error)
      setErrorMsg(apiError.error || '상품 수정에 실패했습니다')
    }
  }

  const thumbRef = useRef<HTMLInputElement>(null)
  const detailRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async () => {
    const thumbFile = thumbRef.current?.files?.[0]
    const detailFile = detailRef.current?.files?.[0]
    if (!thumbFile || !detailFile) {
      setErrorMsg('썸네일과 상세 이미지 모두 선택해주세요')
      return
    }

    try {
      await uploadMutation.mutateAsync({ id, thumbFile, detailFile })
      queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'detail', id] })
    } catch (error) {
      const apiError = await readApiError(error)
      setErrorMsg(apiError.error || '이미지 업로드에 실패했습니다')
    }
  }

  if (productQuery.isPending) {
    return <div className="p-10 text-center">데이터를 불러오는 중...</div>
  }

  if (productQuery.isError) {
    return <div className="p-10 text-center text-rose-600">상품을 불러오지 못했습니다.</div>
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">상품 수정</h1>
        <p className="text-sm text-slate-600">상품 정보를 수정합니다.</p>
      </header>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {errorMsg && (
              <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-600">{errorMsg}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">상품명</Label>
              <Input id="name" {...form.register('name')} placeholder="상품명을 입력하세요" />
              {form.formState.errors.name && (
                <p className="text-sm text-rose-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">상품 설명</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="상품에 대한 상세 설명을 입력하세요"
                rows={4}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-rose-500">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">가격</Label>
              <Input
                id="price"
                type="number"
                {...form.register('price')}
                placeholder="가격을 입력하세요"
              />
              {form.formState.errors.price && (
                <p className="text-sm text-rose-500">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">카테고리</Label>
              <select
                id="categoryId"
                {...form.register('categoryId')}
                className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">카테고리를 선택하세요</option>
                {categoriesQuery.data?.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.categoryId && (
                <p className="text-sm text-rose-500">{form.formState.errors.categoryId.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isSubstitutable"
                {...form.register('isSubstitutable')}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-950"
              />
              <Label htmlFor="isSubstitutable">대체 가능 상품</Label>
            </div>

            <div className="space-y-4 border-t pt-4">
              <Label>상품 이미지</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">썸네일 (400×400)</p>
                  <div className="flex items-center gap-3">
                    {productQuery.data?.thumbUrl ? (
                      <img src={productQuery.data.thumbUrl} alt="Thumbnail" className="h-24 w-24 rounded-md border object-cover" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-md border bg-slate-50 text-xs text-slate-400">이미지 없음</div>
                    )}
                    <Input ref={thumbRef} type="file" accept="image/*" disabled={uploadMutation.isPending} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">상세 이미지 (800×600)</p>
                  <div className="flex items-center gap-3">
                    {productQuery.data?.detailUrl ? (
                      <img src={productQuery.data.detailUrl} alt="Detail" className="h-24 w-24 rounded-md border object-cover" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-md border bg-slate-50 text-xs text-slate-400">이미지 없음</div>
                    )}
                    <Input ref={detailRef} type="file" accept="image/*" disabled={uploadMutation.isPending} />
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImageUpload}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? '업로드 중...' : '이미지 업로드'}
              </Button>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/' })}
                disabled={updateMutation.isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? '수정 중...' : '수정'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
