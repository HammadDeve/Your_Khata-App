<!-- Financial Tracking App Design - Markup File -->
<!-- This file contains the HTML structure and CSS styling for the app -->

<!-- App Structure -->
<!-- The app has two main pages: HomePage (customer list) and CustomerDetailPage (transactions) -->

<!-- 1. HomePage Structure -->
<div class="min-h-screen bg-app-background pb-20">
  <!-- Header Component -->
  <header class="flex justify-between items-center p-4">
    <div class="flex items-center space-x-2">
      <span class="text-xl font-bold">SAJEEL</span>
      <svg class="chevron-down" width="20" height="20"></svg>
    </div>
    <div class="flex items-center space-x-4">
      <svg class="lock" width="20" height="20"></svg>
    </div>
  </header>
  
  <!-- Banner Ad -->
  <div class="bg-blue-600 h-16 mx-4 rounded flex items-center justify-center">
    <span class="text-white font-bold">FREE BUSINESS CHECKING</span>
  </div>
  
  <!-- Summary Bar Component -->
  <div class="flex justify-between p-4 bg-app-card m-4 rounded-lg">
    <!-- Amount Owed Display -->
    <div class="text-center">
      <div class="text-app-text-secondary text-sm">Total to Give</div>
      <div class="font-bold text-app-red text-xl">₹ 38,000</div>
    </div>
    <!-- Amount Given Display -->
    <div class="text-center">
      <div class="text-app-text-secondary text-sm">Total to Get</div>
      <div class="font-bold text-app-green text-xl">₹ 22,000</div>
    </div>
  </div>
  
  <!-- Search Bar Component -->
  <div class="flex items-center justify-between p-4 bg-app-background">
    <div class="flex items-center space-x-2 flex-1">
      <svg class="search" width="20" height="20" class="text-app-text-secondary"></svg>
      <input
        type="text"
        placeholder="Search Customer"
        class="bg-transparent outline-none flex-1 text-app-text-primary"
      />
    </div>
    <div class="flex items-center space-x-4">
      <svg class="filter" width="20" height="20" class="text-app-text-secondary"></svg>
      <div class="border border-app-border rounded px-2 py-1">
        <svg class="file-text" width="16" height="16" class="text-app-text-secondary"></svg>
        <span class="text-xs ml-1">PDF</span>
      </div>
    </div>
  </div>
  
  <!-- Customer List -->
  <div class="mt-2">
    <!-- Customer Item (repeat for each customer) -->
    <div class="flex justify-between items-center p-4 border-b border-app-border cursor-pointer">
      <div class="flex items-center space-x-4">
        <div class="w-8 h-8 flex items-center justify-center">
          <span class="text-app-text-secondary">AK</span>
        </div>
        <div class="font-medium">Akash Kumar</div>
      </div>
      <div class="font-bold text-app-red">
        Rs. 12,000
      </div>
    </div>
    <!-- More customer items would be listed here -->
  </div>
  
  <!-- Add Customer Button -->
  <div class="flex justify-center mt-6 mb-20">
    <button class="bg-black text-white px-6 py-3 rounded-full">
      ADD CUSTOMER
    </button>
  </div>
  
  <!-- Bottom Navigation -->
  <div class="fixed bottom-0 left-0 right-0 bg-app-background border-t border-app-border flex justify-around p-4">
    <div class="flex flex-col items-center">
      <svg class="book-open" width="24" height="24"></svg>
      <span class="text-xs mt-1">Khata</span>
    </div>
    <div class="flex flex-col items-center text-app-text-secondary">
      <svg class="wallet" width="24" height="24"></svg>
      <span class="text-xs mt-1">Batwa</span>
    </div>
    <div class="flex flex-col items-center text-app-text-secondary">
      <svg class="user" width="24" height="24"></svg>
      <span class="text-xs mt-1">Account</span>
    </div>
  </div>
</div>

<!-- 2. CustomerDetailPage Structure -->
<div class="min-h-screen bg-app-background pb-20">
  <!-- Header with Back Button -->
  <header class="flex justify-between items-center p-4">
    <div class="flex items-center space-x-2">
      <button class="text-white">
        ← 
      </button>
    </div>
    <div class="flex items-center space-x-4">
      <svg class="more-horizontal" width="20" height="20"></svg>
    </div>
  </header>
  
  <!-- Customer Balance Card -->
  <div class="bg-app-card mx-4 rounded-lg p-4 mb-4">
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <div class="bg-app-red rounded-full p-2 mr-2">
          <svg class="arrow-down" class="text-white" width="20" height="20"></svg>
        </div>
        <div>
          <div class="text-app-red font-bold">Rs. 12,000</div>
          <div class="text-app-text-secondary text-sm">Maine lene hain</div>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <div class="border border-app-border rounded-md px-3 py-1.5">
          <span class="text-sm">Wasooli</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Transaction Actions -->
  <div class="flex justify-around p-4">
    <div class="flex flex-col items-center">
      <div class="bg-app-card p-3 rounded-lg mb-2">
        <svg class="book" width="20" height="20"></svg>
      </div>
      <span class="text-xs text-app-text-secondary">Book</span>
    </div>
    <!-- Additional action buttons would go here -->
  </div>
  
  <!-- Transaction List Header -->
  <div class="grid grid-cols-3 border-b border-app-border p-4 text-sm">
    <div class="text-app-text-secondary">Date</div>
    <div class="text-app-text-secondary text-center">Maine diye</div>
    <div class="text-app-text-secondary text-right">Maine Liye</div>
  </div>
  
  <!-- Transaction List -->
  <div class="mb-20">
    <!-- Transaction Item (repeat for each transaction) -->
    <div class="border-b border-app-border p-4">
      <div class="flex justify-between items-center">
        <div class="text-app-text-primary">12 Apr</div>
        <div class="font-bold text-app-red">
          Rs. 3,000
        </div>
      </div>
      <div class="text-app-text-secondary text-sm mt-1">
        Bal. Rs. 12,000
      </div>
    </div>
    <!-- More transaction items would be listed here -->
  </div>
  
  <!-- Transaction Action Buttons -->
  <div class="fixed bottom-16 left-0 right-0 flex">
    <button class="bg-app-red flex-1 py-4 text-white font-bold">
      ↑ MAINE DIYE
    </button>
    <button class="bg-app-green flex-1 py-4 text-white font-bold">
      ↓ MAINE LIYE
    </button>
  </div>
  
  <!-- Bottom Navigation (same as HomePage) -->
  <div class="fixed bottom-0 left-0 right-0 bg-app-background border-t border-app-border flex justify-around p-4">
    <!-- Navigation items (same as HomePage) -->
  </div>
</div>

<!-- CSS Styling -->
<style>
  /* Base Colors */
  :root {
    --app-red: #E94057;
    --app-green: #4CAF50;
    --app-background: #121212;
    --app-card: #1E1E1E;
    --app-text-primary: #FFFFFF;
    --app-text-secondary: #AAAAAA;
    --app-border: #2A2A2A;
  }
  
  /* Base Styles */
  body {
    background-color: var(--app-background);
    color: var(--app-text-primary);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    margin: 0;
    padding: 0;
  }
  
  /* Utility Classes */
  .text-app-red {
    color: var(--app-red);
  }
  
  .text-app-green {
    color: var(--app-green);
  }
  
  .bg-app-red {
    background-color: var(--app-red);
  }
  
  .bg-app-green {
    background-color: var(--app-green);
  }
  
  .bg-app-background {
    background-color: var(--app-background);
  }
  
  .bg-app-card {
    background-color: var(--app-card);
  }
  
  .text-app-text-primary {
    color: var(--app-text-primary);
  }
  
  .text-app-text-secondary {
    color: var(--app-text-secondary);
  }
  
  .border-app-border {
    border-color: var(--app-border);
  }
  
  /* Component Specific Styles */
  input::placeholder {
    color: var(--app-text-secondary);
  }
  
  /* Responsive Design */
  @media (min-width: 640px) {
    /* Tablet styles */
    .container {
      max-width: 640px;
      margin: 0 auto;
    }
  }
  
  @media (min-width: 1024px) {
    /* Desktop styles */
    .container {
      max-width: 1024px;
    }
    
    /* Consider showing a sidebar layout on desktop */
    .desktop-layout {
      display: grid;
      grid-template-columns: 250px 1fr;
    }
  }
</style>
