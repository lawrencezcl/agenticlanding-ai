export const testData = {
  users: {
    valid: {
      email: 'test@example.com',
      password: 'TestPassword123!',
    },
    invalid: {
      email: 'invalid-email',
      password: '123',
    },
  },
  pages: {
    home: '/',
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    dashboard: '/dashboard',
  },
  content: {
    heroTitle: 'AI-Powered Landing Pages',
    heroSubtitle: 'Transform campaign context into high-converting, brand-compliant landing pages',
    getStartedButton: 'Get Started Free',
    watchDemoButton: 'Watch Demo',
  },
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 },
    widescreen: { width: 2560, height: 1440 },
  },
  performance: {
    maxLoadTime: 3000, // 3 seconds
    maxFCP: 1800, // First Contentful Paint
    maxLCP: 2500, // Largest Contentful Paint
    maxFID: 100, // First Input Delay
    maxCLS: 0.1, // Cumulative Layout Shift
  },
};