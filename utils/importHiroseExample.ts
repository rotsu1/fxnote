import { importHiroseTrades } from './hiroseParser';

// Note: Make sure your environment variables are set in your .env file
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
// SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

// Example usage function
async function runHiroseImport() {
  try {
    // Replace these with your actual values
    const csvFilePath = './path/to/your/hirose_export.csv';
    const userId = 'your-user-uuid-here';
    
    console.log('Starting Hirose trade import...');
    
    await importHiroseTrades(csvFilePath, userId);
    
    console.log('Import completed successfully!');
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  runHiroseImport();
}

export { runHiroseImport }; 