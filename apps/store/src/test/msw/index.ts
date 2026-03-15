const isBrowser = typeof navigator !== 'undefined' && 'serviceWorker' in navigator

const { worker } = isBrowser ? await import('./browser') : await import('./server')

export { worker }
