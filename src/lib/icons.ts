export const icons = {
  'arrow-up-right': 'M7 17 17 7M7 7h10v10',
  'arrow-right': 'M4 12h16m-6-6 6 6-6 6',
  copy: 'M9 9h11v11H9zM15 9V4H4v11h5',
} as const

export type IconName = keyof typeof icons
