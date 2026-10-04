export const icons = {
  'arrow-up-right': 'M7 17 17 7M7 7h10v10',
  'arrow-right': 'M4 12h16m-6-6 6 6-6 6',
  copy: 'M9 9h11v11H9zM15 9V4H4v11h5',
  plus: 'M12 5v14M5 12h14',
  code: 'M8 8 4 12l4 4m8-8 4 4-4 4m-3-11-2 14',
  'map-pin':
    'M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
} as const

export type IconName = keyof typeof icons
