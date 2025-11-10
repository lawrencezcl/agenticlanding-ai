#!/bin/bash

# AgenticLanding AI UI/UX Test Runner
# This script runs comprehensive Playwright tests and generates a detailed issue report

set -e

echo "🚀 Starting AgenticLanding AI UI/UX Test Suite"
echo "=============================================="

# Create necessary directories
mkdir -p test-results/{screenshots,videos,reports}

# Check if the development server is running
if ! curl -s http://localhost:3001 > /dev/null; then
    echo "❌ Development server not running on localhost:3001"
    echo "Please start the development server with: npm run dev"
    exit 1
fi

echo "✅ Development server confirmed running on localhost:3001"

# Install Playwright browsers if needed
echo "📦 Installing Playwright browsers..."
npx playwright install

echo "🧪 Running comprehensive UI tests..."

# Run the comprehensive test suite
npx playwright test tests/e2e/comprehensive-suite.spec.ts \
    --reporter=json,html,junit,list \
    --output-dir=test-results

echo "📊 Running individual test suites for detailed analysis..."

# Run individual test suites
test_suites=(
    "tests/e2e/homepage.spec.ts"
    "tests/e2e/auth.spec.ts"
    "tests/e2e/accessibility.spec.ts"
    "tests/e2e/performance.spec.ts"
    "tests/e2e/cross-browser.spec.ts"
)

for suite in "${test_suites[@]}"; do
    echo "🔍 Running $(basename "$suite")..."
    npx playwright test "$suite" \
        --reporter=json \
        --output-dir=test-results \
        --grep="@slow" \
        || true  # Continue even if tests fail
done

echo "📈 Generating comprehensive issue report..."

# Generate the issue report
node -e "
const fs = require('fs');
const path = require('path');

// Load test results
const testResultsDir = 'test-results';
const reportFile = path.join(testResultsDir, 'comprehensive-test-report.json');

let report = { summary: {}, issues: [], recommendations: [] };

if (fs.existsSync(reportFile)) {
    report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
}

// Generate detailed issue analysis
const issueAnalysis = {
    critical: [],
    high: [],
    medium: [],
    low: []
};

// Analyze results and categorize issues
if (report.details) {
    report.details.forEach(result => {
        if (result.status === 'failed') {
            issueAnalysis.high.push({
                test: result.testName,
                category: result.category,
                error: result.error || 'Unknown error',
                severity: 'high'
            });
        }

        if (result.accessibilityIssues && result.accessibilityIssues.length > 0) {
            result.accessibilityIssues.forEach(issue => {
                if (issue.toLowerCase().includes('missing') || issue.toLowerCase().includes('required')) {
                    issueAnalysis.high.push({
                        test: result.testName,
                        category: 'Accessibility',
                        issue: issue,
                        severity: 'high'
                    });
                } else {
                    issueAnalysis.medium.push({
                        test: result.testName,
                        category: 'Accessibility',
                        issue: issue,
                        severity: 'medium'
                    });
                }
            });
        }

        if (result.responsiveIssues && result.responsiveIssues.length > 0) {
            result.responsiveIssues.forEach(issue => {
                issueAnalysis.medium.push({
                    test: result.testName,
                    category: 'Responsive Design',
                    issue: issue,
                    severity: 'medium'
                });
            });
        }

        if (result.performanceScore && result.performanceScore < 70) {
            issueAnalysis.high.push({
                test: result.testName,
                category: 'Performance',
                issue: \`Performance score: \${result.performanceScore}/100\`,
                severity: 'high'
            });
        } else if (result.performanceScore && result.performanceScore < 85) {
            issueAnalysis.medium.push({
                test: result.testName,
                category: 'Performance',
                issue: \`Performance score: \${result.performanceScore}/100 (could be improved)\`,
                severity: 'medium'
            });
        }

        if (result.consoleErrors && result.consoleErrors.length > 0) {
            result.consoleErrors.forEach(error => {
                issueAnalysis.critical.push({
                    test: result.testName,
                    category: 'JavaScript Errors',
                    issue: error,
                    severity: 'critical'
                });
            });
        }
    });
}

// Generate recommendations
const recommendations = [];

if (issueAnalysis.critical.length > 0) {
    recommendations.push('🚨 CRITICAL: Fix JavaScript errors and console warnings immediately');
}

if (issueAnalysis.high.filter(i => i.category === 'Performance').length > 0) {
    recommendations.push('⚡ PERFORMANCE: Optimize images, reduce bundle size, and implement lazy loading');
}

if (issueAnalysis.high.filter(i => i.category === 'Accessibility').length > 0) {
    recommendations.push('♿ ACCESSIBILITY: Add proper ARIA labels, alt text, and ensure keyboard navigation');
}

if (issueAnalysis.medium.filter(i => i.category === 'Responsive Design').length > 0) {
    recommendations.push('📱 RESPONSIVE: Fix layout issues across different screen sizes');
}

if (report.summary && report.summary.categories) {
    report.summary.categories.forEach(cat => {
        if (cat.avgPerformance < 75) {
            recommendations.push(\`🎯 \${cat.category}: Focus on improving performance scores (current: \${cat.avgPerformance.toFixed(0)})\`);
        }
    });
}

// Generate final report
const finalReport = {
    timestamp: new Date().toISOString(),
    summary: report.summary || {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        passRate: '0%'
    },
    issueAnalysis,
    recommendations,
    nextSteps: [
        '1. Address all critical and high-priority issues immediately',
        '2. Implement recommended performance optimizations',
        '3. Improve accessibility compliance for better user experience',
        '4. Test fixes across different browsers and devices',
        '5. Set up automated testing in CI/CD pipeline'
    ]
};

// Write detailed report
fs.writeFileSync(
    path.join(testResultsDir, 'detailed-issue-report.json'),
    JSON.stringify(finalReport, null, 2)
);

console.log('\\n📋 COMPREHENSIVE ISSUE REPORT');
console.log('==============================');
console.log(\`Total Tests: \${finalReport.summary.totalTests}\`);
console.log(\`Passed: \${finalReport.summary.passedTests}\`);
console.log(\`Failed: \${finalReport.summary.failedTests}\`);
console.log(\`Pass Rate: \${finalReport.summary.passRate}\`);

console.log('\\n🚨 Issues by Severity:');
console.log(\`Critical: \${issueAnalysis.critical.length}\`);
console.log(\`High: \${issueAnalysis.high.length}\`);
console.log(\`Medium: \${issueAnalysis.medium.length}\`);
console.log(\`Low: \${issueAnalysis.low.length}\`);

if (recommendations.length > 0) {
    console.log('\\n💡 Recommendations:');
    recommendations.forEach((rec, index) => {
        console.log(\`\${index + 1}. \${rec}\`);
    });
}

console.log('\\n📄 Detailed report saved to: test-results/detailed-issue-report.json');
"

echo "🎉 UI/UX testing completed!"

# Open HTML report if available
if [ -f "test-results/index.html" ]; then
    echo "🌐 Opening HTML report..."
    if command -v open > /dev/null; then
        open test-results/index.html
    elif command -v xdg-open > /dev/null; then
        xdg-open test-results/index.html
    fi
fi

echo ""
echo "📊 Test Results Summary:"
echo "- HTML Report: test-results/index.html"
echo "- JSON Report: test-results/results.json"
echo "- Detailed Issues: test-results/detailed-issue-report.json"
echo "- Screenshots: test-results/screenshots/"
echo "- Videos: test-results/videos/"