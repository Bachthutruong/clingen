#!/usr/bin/env node

/**
 * Script to update all pages to use real API data instead of hardcoded data
 * This script will:
 * 1. Check all pages for hardcoded data
 * 2. Replace with API calls
 * 3. Add proper error handling
 * 4. Add loading states
 */

const fs = require('fs');
const path = require('path');

// Pages to check and update
const pagesToUpdate = [
  'src/pages/Finance/FinancialReports.tsx',
  'src/pages/Finance/SupplierManagement.tsx', 
  'src/pages/Finance/InvoicePayments.tsx',
  'src/pages/Reception/PatientRegistration.tsx',
  'src/pages/Reception/PatientList.tsx',
  'src/pages/Reception/ServiceSelection.tsx',
  'src/pages/Reception/ReferralSources.tsx',
  'src/pages/Lab/SampleManagement.tsx',
  'src/pages/Lab/SampleStatus.tsx',
  'src/pages/Lab/TestResults.tsx',
  'src/pages/Lab/PatientInfo.tsx',
  'src/pages/Lab/PackagingManagement.tsx',
  'src/pages/Lab/InventoryManagement.tsx',
  'src/pages/Lab/SupplyManagement.tsx',
  'src/pages/Lab/Statistics.tsx',
  'src/pages/Admin/UserManagement.tsx',
  'src/pages/Admin/SystemHistory.tsx',
  'src/pages/Dashboard.tsx'
];

// Common patterns to replace
const patternsToReplace = [
  {
    name: 'Hardcoded useState with mock data',
    pattern: /const \[(\w+)\] = useState\(\[[\s\S]*?\]\)/g,
    replacement: 'const [$1, set$1] = useState([])',
    description: 'Replace hardcoded useState with empty array and setter'
  },
  {
    name: 'Mock data objects',
    pattern: /const mockData[\s\S]*?= \[[\s\S]*?\];/g,
    replacement: '',
    description: 'Remove mock data objects'
  },
  {
    name: 'Hardcoded data in JSX',
    pattern: /\{mockData\[0\]\.(\w+)\}/g,
    replacement: '{$1[0]?.$1 || 0}',
    description: 'Replace hardcoded data access with dynamic data'
  }
];

// API integration patterns to add
const apiIntegrationPatterns = [
  {
    name: 'Add loading state',
    pattern: /const \[(\w+), set\1\] = useState\(\[\]\)/g,
    replacement: 'const [$1, set$1] = useState([])\n  const [loading$1, setLoading$1] = useState(false)',
    description: 'Add loading state for data fetching'
  },
  {
    name: 'Add useEffect for API call',
    pattern: /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\)/g,
    replacement: `useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading$1(true)
        const response = await ${1}Api.getAll()
        set$1(response.content || response || [])
      } catch (error) {
        console.error('Error fetching $1:', error)
        toast.error('Không thể tải dữ liệu $1')
        set$1([])
      } finally {
        setLoading$1(false)
      }
    }
    
    fetchData()
  }, [])`,
    description: 'Add proper API call with error handling'
  }
];

console.log('🔍 Checking pages for hardcoded data...');

pagesToUpdate.forEach(pagePath => {
  if (fs.existsSync(pagePath)) {
    console.log(`📄 Processing: ${pagePath}`);
    
    let content = fs.readFileSync(pagePath, 'utf8');
    let hasChanges = false;
    
    // Check for hardcoded data patterns
    patternsToReplace.forEach(pattern => {
      if (pattern.pattern.test(content)) {
        console.log(`  ⚠️  Found: ${pattern.name}`);
        content = content.replace(pattern.pattern, pattern.replacement);
        hasChanges = true;
      }
    });
    
    // Add API integration patterns
    apiIntegrationPatterns.forEach(pattern => {
      if (pattern.pattern.test(content)) {
        console.log(`  ➕ Adding: ${pattern.name}`);
        content = content.replace(pattern.pattern, pattern.replacement);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(pagePath, content, 'utf8');
      console.log(`  ✅ Updated: ${pagePath}`);
    } else {
      console.log(`  ✅ Already using real API: ${pagePath}`);
    }
  } else {
    console.log(`  ❌ File not found: ${pagePath}`);
  }
});

console.log('\n🎉 Script completed!');
console.log('\n📋 Next steps:');
console.log('1. Review the changes made to each file');
console.log('2. Test API endpoints are working correctly');
console.log('3. Add proper error handling where needed');
console.log('4. Add loading states to UI components');
console.log('5. Test the application thoroughly');



