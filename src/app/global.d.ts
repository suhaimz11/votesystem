declare global {
    interface Window {
      ethereum: any; // Or use a more specific type if you want better typing for MetaMask's provider
    }
  }
  
  export {}; // This is needed to make this file a module
  