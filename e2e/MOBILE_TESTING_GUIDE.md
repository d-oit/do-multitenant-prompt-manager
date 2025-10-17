# Mobile-First E2E Testing Guide

## Overview

This guide covers the comprehensive E2E testing suite for the mobile-first responsive design implementation of the d.o. Prompt Manager application.

## Test Coverage

### 🎯 **Core Areas Tested**

1. **Mobile-First Responsive Design** (`mobile-responsive.spec.ts`)
   - Layout adaptation across viewport sizes (320px - 1920px+)
   - Mobile navigation with hamburger menu
   - Touch target size compliance (44px minimum)
   - Safe area support for iOS devices
   - Pull-to-refresh functionality

2. **Touch Interactions** (`touch-interactions.spec.ts`)
   - Swipe gestures for navigation
   - Long press context menus
   - Pinch-to-zoom prevention
   - Bottom sheet drag interactions
   - Floating action button behavior

3. **Performance & Core Web Vitals** (`performance-mobile.spec.ts`)
   - Largest Contentful Paint (LCP) < 2.5s
   - First Input Delay (FID) < 100ms
   - Cumulative Layout Shift (CLS) < 0.1
   - Memory usage monitoring
   - Network performance on slow connections

4. **Modern UI Components** (`modern-components.spec.ts`)
   - Command palette functionality
   - Enhanced data table responsiveness
   - Skeleton loader states
   - Theme switching consistency

5. **Enhanced Accessibility** (`accessibility-enhanced.spec.ts`)
   - WCAG 2.1 AA compliance
   - Keyboard navigation flow
   - Screen reader support
   - Focus management in modals
   - High contrast mode compatibility

6. **Cross-Device Integration** (`test-runner-mobile.spec.ts`)
   - Complete user flows across devices
   - Feature parity verification
   - Performance benchmarks by device type

## Device Configuration

### 📱 **Test Devices**

| Device Type | Viewport | Browser Engine | Use Case |
|-------------|----------|----------------|----------|
| iPhone SE   | 375x667  | WebKit         | Small mobile screens |
| iPhone 12   | 390x844  | WebKit         | Modern mobile screens |
| Pixel 5     | 393x851  | Chromium       | Android devices |
| iPad        | 768x1024 | WebKit         | Tablet portrait |
| iPad Pro    | 1024x1366| WebKit         | Tablet landscape |
| Desktop     | 1200x800 | Chromium       | Desktop experience |

### 🎨 **Responsive Breakpoints Tested**

- **Mobile**: < 900px (single column, mobile nav)
- **Tablet**: 900px - 1024px (sidebar, adapted layout)
- **Desktop**: > 1024px (full sidebar, multi-column)
- **Ultra-wide**: > 1920px (optimized for large screens)

## Running Tests

### 🚀 **Quick Start**

```bash
# Run all E2E tests across all devices
npm run test:e2e

# Run in interactive UI mode
npm run test:e2e:ui

# Run with visible browser (headed mode)
npm run test:e2e:headed
```

### 🎯 **Targeted Testing**

```bash
# Mobile-specific tests only
npm run test:e2e -- --grep "Mobile"

# Touch interaction tests
npm run test:e2e -- touch-interactions.spec.ts

# Performance tests
npm run test:e2e -- performance-mobile.spec.ts

# Accessibility tests
npm run test:e2e -- accessibility-enhanced.spec.ts

# Single device testing
npm run test:e2e -- --project mobile-chrome

# Debug mode for troubleshooting
npm run test:e2e:debug
```

### 📊 **Performance Testing**

```bash
# Run performance benchmarks
npm run test:e2e -- performance-mobile.spec.ts --project mobile-chrome

# Network throttling tests
npm run test:e2e -- --grep "slow connection"

# Memory usage monitoring
npm run test:e2e -- --grep "Memory"
```

## Test Scenarios

### 📱 **Mobile User Journey**

1. **App Load & Navigation**
   - Load application on mobile device
   - Verify mobile navigation appears
   - Test hamburger menu functionality
   - Navigate between main sections

2. **Content Interaction**
   - View prompts in mobile card layout
   - Test pull-to-refresh functionality
   - Interact with floating action button
   - Verify touch target sizes

3. **Responsive Behavior**
   - Rotate device (portrait/landscape)
   - Test safe area handling
   - Verify content remains accessible

### 🖥️ **Desktop User Journey**

1. **Full Feature Access**
   - Load application on desktop
   - Verify sidebar navigation
   - Test desktop table layout
   - Interact with all features

2. **Responsive Verification**
   - Resize browser window
   - Test breakpoint transitions
   - Verify layout adaptations

### ♿ **Accessibility Journey**

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Test skip links functionality
   - Verify focus indicators
   - Test modal focus trapping

2. **Screen Reader Simulation**
   - Verify proper heading hierarchy
   - Test ARIA labels and descriptions
   - Check live region announcements

## Performance Thresholds

### 🎯 **Core Web Vitals Targets**

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP    | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| FID    | ≤ 100ms | ≤ 300ms | > 300ms |
| CLS    | ≤ 0.1 | ≤ 0.25 | > 0.25 |

### 📱 **Mobile-Specific Thresholds**

- **Touch Target Size**: Minimum 44x44px
- **Load Time**: < 6 seconds on slow 3G
- **Interaction Response**: < 300ms
- **Memory Usage**: < 50MB increase during navigation
- **Animation Frame Rate**: > 30fps

## Common Issues & Solutions

### 🐛 **Troubleshooting**

#### Mobile Navigation Not Appearing
- Check viewport size is < 900px
- Verify CSS media queries are working
- Ensure mobile navigation component is rendered

#### Touch Targets Too Small
- Elements should be minimum 44x44px
- Check CSS for proper sizing
- Verify touch-action properties

#### Performance Issues
- Check bundle size and code splitting
- Verify image optimization
- Test with network throttling

#### Accessibility Failures
- Ensure proper ARIA labels
- Check keyboard navigation flow
- Verify focus indicators are visible

### 🔧 **Test Debugging**

```bash
# Run single test with debug output
npm run test:e2e:debug -- --grep "specific test name"

# Capture screenshots on failure
npm run test:e2e -- --screenshot=only-on-failure

# Record video of test execution
npm run test:e2e -- --video=retain-on-failure

# Generate detailed HTML report
npm run test:e2e -- --reporter=html
```

## Continuous Integration

### 🔄 **CI/CD Integration**

The test suite is designed for CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run E2E Tests
  run: |
    npm run test:e2e -- --project chromium
    npm run test:e2e -- --project mobile-chrome
    npm run test:e2e -- --project mobile-safari
```

### 📊 **Test Reports**

- HTML reports generated in `test-results/`
- Screenshots and videos for failed tests
- Performance metrics logged to console
- Accessibility violations reported

## Best Practices

### ✅ **Writing Mobile Tests**

1. **Always test multiple viewport sizes**
2. **Use realistic touch gestures**
3. **Verify performance on slower devices**
4. **Test with reduced motion preferences**
5. **Include accessibility checks**

### 🎯 **Test Reliability**

1. **Wait for network idle before assertions**
2. **Use proper timeouts for animations**
3. **Handle async operations correctly**
4. **Clean up test data between runs**

### 📱 **Mobile-Specific Considerations**

1. **Test on actual device sizes**
2. **Verify safe area handling**
3. **Check touch event handling**
4. **Test offline scenarios**
5. **Verify PWA functionality**

## Maintenance

### 🔄 **Regular Updates**

- Update device configurations quarterly
- Review performance thresholds monthly
- Add new test scenarios for new features
- Monitor test execution times
- Update accessibility standards as needed

### 📈 **Metrics Tracking**

Track these metrics over time:
- Test execution duration
- Performance benchmark trends
- Accessibility compliance scores
- Device-specific failure rates
- User journey completion rates

---

## Quick Reference

### 🚀 **Essential Commands**

```bash
# Full test suite
npm run test:e2e

# Mobile only
npm run test:e2e -- --project mobile-chrome

# Performance tests
npm run test:e2e -- performance-mobile.spec.ts

# Accessibility tests
npm run test:e2e -- accessibility-enhanced.spec.ts

# Debug mode
npm run test:e2e:debug
```

### 📞 **Need Help?**

- Check test output for specific error messages
- Review HTML reports in `test-results/`
- Use debug mode for step-by-step execution
- Consult device-specific troubleshooting guides