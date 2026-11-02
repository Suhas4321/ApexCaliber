import DipSimulator from './solid/DipSimulator'
import IspSimulator from './solid/IspSimulator'
import LspSimulator from './solid/LspSimulator'
import OcpSimulator from './solid/OcpSimulator'
import SrpSimulator from './solid/SrpSimulator'

interface Props {
  letter: string
  name: string
}

export default function SolidPrincipleSimulator({ letter }: Props) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4 space-y-4 shadow-sm select-none">
      {letter === 'S' && <SrpSimulator />}
      {letter === 'O' && <OcpSimulator />}
      {letter === 'L' && <LspSimulator />}
      {letter === 'I' && <IspSimulator />}
      {letter === 'D' && <DipSimulator />}
    </div>
  )
}
