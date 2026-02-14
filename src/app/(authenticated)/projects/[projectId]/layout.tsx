import { ProjectTabs } from '@/components/layout/project-tabs'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const { projectId } = await params

  return (
    <div>
      <ProjectTabs projectId={projectId} />
      {children}
    </div>
  )
}
