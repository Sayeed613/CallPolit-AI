import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MobileNav from './MobileNav'
import useUIStore from '../../stores/uiStore'
import ToastProvider from '../ui/Toast'
import { cn } from '../../lib/utils'

interface PageWrapperProps {
  children: React.ReactNode
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

export function PageWrapper({ children }: PageWrapperProps) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <ToastProvider>
      <div className="min-h-screen bg-canvas">
        <Sidebar />

        <div
          className={cn(
            'transition-all duration-200 lg:ml-[220px]',
            sidebarCollapsed && 'lg:ml-14',
          )}
        >
          <TopBar />

          <main className="pb-20 lg:pb-0">
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="p-6"
            >
              {children}
            </motion.div>
          </main>
        </div>

        <MobileNav />
      </div>
    </ToastProvider>
  )
}

export default PageWrapper
