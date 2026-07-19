import './App.css'
import TournamentGrid from './components/TournamentGrid/TournamentGrid'
import dolphinsLogo from './assets/dolphins-logo.jpg'
import dolphins from './assets/dolphins.jpg'

function App() {
  return (
    <>
      <TournamentGrid
        tournaments={[
          { id: "1", name: "Scumbagger Invitational", img: { src: dolphinsLogo } },
          { id: "2", name: "WALLO", img: { src: dolphins } }
        ]}
      />
    </>
  )
}

export default App
