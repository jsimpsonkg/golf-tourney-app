import './App.css'
import TournamentGrid from './components/TournamentGrid/TournamentGrid'

function App() {
  return (
    <>
      <TournamentGrid
        tournaments={[
          { id: "1", name: "Scumbagger Invitational", img: { src: "/images/dolphins-logo.jpg" } },
          { id: "2", name: "WALLO", img: { src: "/images/dolphins.jpg" } }
        ]}
      />
    </>
  )
}

export default App
