import { Toaster } from "@/components/ui/toaster"
import Terminal from "@/pages/Terminal"

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Terminal />
      <Toaster />
    </div>
  )
}

export default App