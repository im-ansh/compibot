const WelcomeMessage = () => {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <div className="space-y-2">
        <h2 className="font-serif text-5xl font-bold">Say hello to Compibot</h2>
        <p className="text-muted-foreground text-lg">
          Your intelligent AI companion with multiple reasoning models
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-6 border border-border rounded-lg">
          <h3 className="font-semibold mb-2">⚡ Lightweight</h3>
          <p className="text-sm text-muted-foreground">
            Quick and simple responses for everyday questions
          </p>
        </div>
        
        <div className="p-6 border border-border rounded-lg">
          <h3 className="font-semibold mb-2">🚀 Pro</h3>
          <p className="text-sm text-muted-foreground">
            Detailed reasoning for complex queries
          </p>
        </div>
        
        <div className="p-6 border border-border rounded-lg">
          <h3 className="font-semibold mb-2">🌟 Giga</h3>
          <p className="text-sm text-muted-foreground">
            4 combined responses for comprehensive insights
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;
