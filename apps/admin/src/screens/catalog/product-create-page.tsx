import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
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
  createProductMutationOptions,
  uploadProductImagesMutationOptions,
} from '~/lib/queries/catalog'
import { readApiError } from '~/lib/api/core'
import { type DragEvent, useRef, useState } from 'react'

const productSchema = z.object({
  name: z.string().min(1, '상품명을 입력해주세요'),
  description: z.string().min(1, '상품 설명을 입력해주세요'),
  price: z.coerce.number().int().positive('가격은 0보다 커야 합니다'),
  categoryId: z.string().uuid('카테고리를 선택해주세요'),
  brand: z.string().optional(),
  weight: z.union([z.coerce.number().int().positive('무게는 0보다 커야 합니다'), z.nan(), z.literal('')]).optional().transform((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined)),
  isSubstitutable: z.boolean().default(false),
})

type ProductFormValues = z.input<typeof productSchema>

export function ProductCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const categoriesQuery = useQuery(adminCategoriesQueryOptions())
  const createMutation = useMutation(createProductMutationOptions(queryClient))
  const uploadMutation = useMutation(uploadProductImagesMutationOptions(queryClient))
  const thumbRef = useRef<HTMLInputElement>(null)
  const detailRef = useRef<HTMLInputElement>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)
  const [detailPreview, setDetailPreview] = useState<string | null>(null)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      categoryId: '',
      brand: '',
      weight: undefined,
      isSubstitutable: false,
    },
  })

  const handleDrop = (
    ref: React.RefObject<HTMLInputElement | null>,
    setPreview: (url: string | null) => void,
  ) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file?.type.startsWith('image/')) return
    const dt = new DataTransfer()
    dt.items.add(file)
    if (ref.current) ref.current.files = dt.files
    setPreview(URL.createObjectURL(file))
  }


  const onSubmit = async (data: ProductFormValues) => {
    setErrorMsg(null)
    try {
      const { brand, weight, ...rest } = data as z.infer<typeof productSchema>
      const payload = { ...rest, brand: brand || undefined, weight: weight || undefined }
      const created = await createMutation.mutateAsync(payload)
      const thumbFile = thumbRef.current?.files?.[0]
      const detailFile = detailRef.current?.files?.[0]
      if (thumbFile && detailFile) {
        await uploadMutation.mutateAsync({ id: created.id, thumbFile, detailFile })
      }
      navigate({ to: '/' })
    } catch (error) {
      const apiError = await readApiError(error)
      setErrorMsg(apiError.error || '상품 등록에 실패했습니다')
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">상품 등록</h1>
        <p className="text-sm text-slate-600">새로운 상품을 카탈로그에 추가합니다.</p>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">브랜드</Label>
                <Input id="brand" {...form.register('brand')} placeholder="브랜드명" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">무게 (g)</Label>
                <Input id="weight" type="number" {...form.register('weight')} placeholder="무게" />
                {form.formState.errors.weight && (
                  <p className="text-sm text-rose-500">{form.formState.errors.weight.message}</p>
                )}
              </div>
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
                <div
                  className="space-y-2"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop(thumbRef, setThumbPreview)}
                >
                  <p className="text-sm font-medium text-slate-700">썸네일 (400×400)</p>
                  <div className="flex items-center gap-3">
                    {thumbPreview ? (
                      <img src={thumbPreview} alt="Thumb preview" className="h-24 w-24 rounded-md border object-cover" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed bg-slate-50 text-xs text-slate-400">드래그 또는 선택</div>
                    )}
                    <Input
                      ref={thumbRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        setThumbPreview(file ? URL.createObjectURL(file) : null)
                      }}
                    />
                  </div>
                </div>
                <div
                  className="space-y-2"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop(detailRef, setDetailPreview)}
                >
                  <p className="text-sm font-medium text-slate-700">상세 이미지 (800×600)</p>
                  <div className="flex items-center gap-3">
                    {detailPreview ? (
                      <img src={detailPreview} alt="Detail preview" className="h-24 w-24 rounded-md border object-cover" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed bg-slate-50 text-xs text-slate-400">드래그 또는 선택</div>
                    )}
                    <Input
                      ref={detailRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        setDetailPreview(file ? URL.createObjectURL(file) : null)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: '/' })}
                disabled={createMutation.isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '등록 중...' : '등록'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
