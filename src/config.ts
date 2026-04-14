// Default tenant ID — set once on first setup, used for all DB inserts
// that require tenant_id (legacy schema constraint).
export const DEFAULT_TENANT_ID = 'e47461d3-56e2-45cd-90ec-64e15f155a51';

export const config = {
  platformName: 'My Community',
  platformTagline: 'Connect with your community',
  platformLogo: '/logo.png',
  primaryColor: '#ffffff',
  accentColor: '#1a1a2e',
  backgroundColor: '#0a0a0a',
  cardBackground: 'rgba(255,255,255,0.06)',
  textColor: '#f0f0f0',
  navColor: 'rgba(10,10,10,0.85)',
  buttonColor: '#ffffff',
  borderColor: 'rgba(255,255,255,0.1)',
  defaultLanguage: 'en',
  commerceEnabled: false,
  venueLabel: 'Venues',
  productLabel: 'Products',
  memberLabel: 'Members',
};
