import { overlay } from 'overlay-kit'
import { Button } from '@fullstack-forge/design-system/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@fullstack-forge/design-system/components/dialog'

interface ConfirmDialogProps {
  isOpen: boolean
  close: (result: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
}

function ConfirmDialog({
  isOpen,
  close,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close(false)}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => close(true)}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AlertDialogProps {
  isOpen: boolean
  close: () => void
  title: string
  description: string
  confirmLabel?: string
}

function AlertDialog({
  isOpen,
  close,
  title,
  description,
  confirmLabel = '확인',
}: AlertDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => close()}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ConfirmActionOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
}

export async function confirmAction({
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant,
}: ConfirmActionOptions): Promise<boolean> {
  return overlay.openAsync<boolean>(({ isOpen, close }) => (
    <ConfirmDialog
      isOpen={isOpen}
      close={close}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      variant={variant}
    />
  ))
}

interface AlertActionOptions {
  title: string
  description: string
  confirmLabel?: string
}

export async function alertAction({
  title,
  description,
  confirmLabel,
}: AlertActionOptions): Promise<void> {
  return overlay.openAsync<void>(({ isOpen, close }) => (
    <AlertDialog
      isOpen={isOpen}
      close={() => close()}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
    />
  ))
}
