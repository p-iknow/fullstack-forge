import { CheckCircle2Icon, ShoppingCartIcon, XCircleIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

type CartToastProps = {
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
}

function CartSuccessToast({
  title,
  description,
  actionLabel,
  actionHref,
  toastId,
}: CartToastProps & { toastId: string | number }) {
  return (
    <div className="flex w-[360px] items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-lg">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <ShoppingCartIcon className="h-4 w-4 text-primary" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle2Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-sm font-medium text-foreground">{title}</p>
        </div>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        {actionLabel && actionHref ? (
          <a
            href={actionHref}
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {actionLabel}
            <span aria-hidden="true">&rarr;</span>
          </a>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => toast.dismiss(toastId)}
        className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="닫기"
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function CartErrorToast({
  title,
  description,
  toastId,
}: CartToastProps & { toastId: string | number }) {
  return (
    <div className="flex w-[360px] items-start gap-3 rounded-xl border border-destructive/20 bg-card p-4 shadow-lg">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
        <XCircleIcon className="h-4 w-4 text-destructive" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>

      <button
        type="button"
        onClick={() => toast.dismiss(toastId)}
        className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="닫기"
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export const cartToast = {
  success: ({ title, description, actionLabel, actionHref }: CartToastProps) => {
    toast.custom((id) => (
      <CartSuccessToast
        toastId={id}
        title={title}
        description={description}
        actionLabel={actionLabel}
        actionHref={actionHref}
      />
    ))
  },
  error: ({ title, description }: Pick<CartToastProps, 'title' | 'description'>) => {
    toast.custom((id) => <CartErrorToast toastId={id} title={title} description={description} />)
  },
}
