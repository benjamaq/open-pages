/**
 * TypingIndicator Component
 * Shows 3 bouncing dots to indicate Elli is "typing"
 */

export function TypingIndicator() {
  return (
    <div className="flex items-center justify-center gap-1">
      <span 
        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" 
        style={{ animationDelay: '0ms', animationDuration: '1s' }} 
      />
      <span 
        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" 
        style={{ animationDelay: '150ms', animationDuration: '1s' }} 
      />
      <span 
        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" 
        style={{ animationDelay: '300ms', animationDuration: '1s' }} 
      />
    </div>
  );
}

