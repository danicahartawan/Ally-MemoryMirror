export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-light py-4 px-6">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <p className="text-neutral-medium mb-3 sm:mb-0">&copy; 2023 Memory Mirror - Assistive Technology</p>
        <div className="flex items-center space-x-4">
          <button className="text-neutral-medium hover:text-primary focus-visible focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1">
            <i className="fas fa-question-circle mr-1"></i>Help
          </button>
          <button className="text-neutral-medium hover:text-primary focus-visible focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1">
            <i className="fas fa-shield-alt mr-1"></i>Privacy
          </button>
          <button className="text-neutral-medium hover:text-primary focus-visible focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1">
            <i className="fas fa-file-contract mr-1"></i>Terms
          </button>
        </div>
      </div>
    </footer>
  );
}
