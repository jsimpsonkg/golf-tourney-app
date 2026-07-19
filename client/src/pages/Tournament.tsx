import { useParams } from 'react-router-dom'

const Tournament = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div>Tournament {id}</div>
  )
}

export default Tournament
