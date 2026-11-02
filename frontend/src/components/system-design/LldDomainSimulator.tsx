import BookMyShowSimulator from './lld/BookMyShowSimulator'
import ElevatorSimulator from './lld/ElevatorSimulator'
import NotificationRouterSimulator from './lld/NotificationRouterSimulator'
import ParkingLotSimulator from './lld/ParkingLotSimulator'
import SplitwiseSimulator from './lld/SplitwiseSimulator'

interface Props {
  problemId: string
  problemTitle: string
}

export default function LldDomainSimulator({ problemId }: Props) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4 space-y-4 shadow-sm select-none">
      {problemId === 'lld-01-parking-lot' && <ParkingLotSimulator />}
      {problemId === 'lld-02-splitwise' && <SplitwiseSimulator />}
      {problemId === 'lld-03-bookmyshow' && <BookMyShowSimulator />}
      {problemId === 'lld-04-elevator' && <ElevatorSimulator />}
      {problemId === 'lld-05-notification-router' && <NotificationRouterSimulator />}
    </div>
  )
}
