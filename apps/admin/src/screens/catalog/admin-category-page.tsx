import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { z } from 'zod'
import { Badge } from '@fullstack-forge/design-system/components/badge'
import { Button } from '@fullstack-forge/design-system/components/button'
import { Input } from '@fullstack-forge/design-system/components/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@fullstack-forge/design-system/components/table'
import {
  adminCategoriesFullQueryOptions,
  createCategoryMutationOptions,
  deleteCategoryMutationOptions,
  updateCategoryMutationOptions,
} from '~/lib/queries/catalog'
import { readApiError } from '~/lib/api/core'
import type { AdminCategory } from '~/lib/api/catalog'
import { alertAction, confirmAction } from '~/lib/overlay/confirm'

const categorySchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  slug: z.string().min(1, '슬러그를 입력해주세요').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '소문자, 숫자, 하이픈만 사용 가능합니다 (예: my-category)'),
  displayOrder: z.number().int().nonnegative('표시 순서는 0 이상이어야 합니다'),
  isActive: z.boolean(),
})


export function AdminCategoryPage() {
  const queryClient = useQueryClient()
  const categoriesQuery = useQuery(adminCategoriesFullQueryOptions())

  const createMutation = useMutation(createCategoryMutationOptions(queryClient))
  const updateMutation = useMutation(updateCategoryMutationOptions(queryClient))
  const deleteMutation = useMutation(deleteCategoryMutationOptions(queryClient))

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<AdminCategory>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    displayOrder: 0,
    isActive: true,
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleEditClick = (category: AdminCategory) => {
    setEditingId(category.id)
    setEditForm(category)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    const result = categorySchema.safeParse({
      name: editForm.name ?? '',
      slug: editForm.slug ?? '',
      displayOrder: editForm.displayOrder ?? 0,
      isActive: editForm.isActive ?? true,
    })
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[issue.path[0] as string] = issue.message
      }
      setValidationErrors(errors)
      return
    }
    setValidationErrors({})
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        data: result.data,
      })
      setEditingId(null)
    } catch (error) {
      const apiError = await readApiError(error)
      await alertAction({ title: '수정 실패', description: apiError.error || '카테고리 수정에 실패했습니다' })
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction({ title: '카테고리 삭제', description: '정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.', confirmLabel: '삭제', variant: 'destructive' })
    if (!confirmed) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      const apiError = await readApiError(error)
      await alertAction({ title: '삭제 실패', description: apiError.error || '카테고리 삭제에 실패했습니다' })
    }
  }

  const handleCreate = async () => {
    const result = categorySchema.safeParse(createForm)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[issue.path[0] as string] = issue.message
      }
      setValidationErrors(errors)
      return
    }
    setValidationErrors({})
    try {
      await createMutation.mutateAsync(result.data)
      setIsCreating(false)
      setCreateForm({ name: '', slug: '', displayOrder: 0, isActive: true })
    } catch (error) {
      const apiError = await readApiError(error)
      await alertAction({ title: '생성 실패', description: apiError.error || '카테고리 생성에 실패했습니다' })
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <Badge>admin catalog</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">카테고리 관리</h1>
          <p className="text-sm text-slate-600">카테고리 목록을 조회하고 관리합니다.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          카테고리 추가
        </Button>
      </header>

      <section className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>슬러그</TableHead>
              <TableHead>표시 순서</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isCreating && (
              <TableRow>
                <TableCell>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="이름"
                    className="h-8"
                  />
                  {validationErrors.name && <p className="mt-1 text-xs text-rose-500">{validationErrors.name}</p>}
                </TableCell>
                <TableCell>
                  <Input
                    value={createForm.slug}
                    onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                    placeholder="슬러그"
                    className="h-8"
                  />
                  {validationErrors.slug && <p className="mt-1 text-xs text-rose-500">{validationErrors.slug}</p>}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={createForm.displayOrder}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, displayOrder: Number(e.target.value) })
                    }
                    className="h-8 w-24"
                  />
                  {validationErrors.displayOrder && <p className="mt-1 text-xs text-rose-500">{validationErrors.displayOrder}</p>}
                </TableCell>
                <TableCell>
                  <select
                    value={createForm.isActive ? 'true' : 'false'}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, isActive: e.target.value === 'true' })
                    }
                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
                  >
                    <option value="true">활성</option>
                    <option value="false">비활성</option>
                  </select>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending}>
                      저장
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsCreating(false)}>
                      취소
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {categoriesQuery.data?.items.map((item) => (
              <TableRow key={item.id}>
                {editingId === item.id ? (
                  <>
                    <TableCell>
                      <Input
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="h-8"
                      />
                      {validationErrors.name && <p className="mt-1 text-xs text-rose-500">{validationErrors.name}</p>}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editForm.slug || ''}
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="h-8"
                      />
                      {validationErrors.slug && <p className="mt-1 text-xs text-rose-500">{validationErrors.slug}</p>}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editForm.displayOrder ?? 0}
                        onChange={(e) =>
                          setEditForm({ ...editForm, displayOrder: Number(e.target.value) })
                        }
                        className="h-8 w-24"
                      />
                      {validationErrors.displayOrder && <p className="mt-1 text-xs text-rose-500">{validationErrors.displayOrder}</p>}
                    </TableCell>
                    <TableCell>
                      <select
                        value={editForm.isActive ? 'true' : 'false'}
                        onChange={(e) =>
                          setEditForm({ ...editForm, isActive: e.target.value === 'true' })
                        }
                        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
                      >
                        <option value="true">활성</option>
                        <option value="false">비활성</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={updateMutation.isPending}
                        >
                          저장
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          취소
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.slug}</TableCell>
                    <TableCell>{item.displayOrder}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'secondary' : 'outline'}>
                        {item.isActive ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditClick(item)}>
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          삭제
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </main>
  )
}
