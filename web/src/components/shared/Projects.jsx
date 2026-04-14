import { useState, useCallback } from 'react'
import Button from './Button'

/**
 * Projects view for adding agent names to an in-memory list and removing rows from a simple table.
 * @param {Object} props - No props are read; all UI state is managed inside the component.
 * @example
 * <Projects />
 */
function Projects() {
  const [agentName, setAgentName] = useState('')
  const [agents, setAgents] = useState([])

  const handleAdd = useCallback(() => {
    const name = agentName.trim()
    if (!name) return
    setAgents((prev) => [...prev, { id: Date.now(), name }])
    setAgentName('')
  }, [agentName])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleAdd()
  }, [handleAdd])

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--spacing-xx-small)', maxWidth: 520 }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label className="form-label">Agent Name</label>
          <input
            className="form-input"
            type="text"
            placeholder="Enter agent name..."
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button variant="primary" size={32} onClick={handleAdd}>Add</Button>
      </div>

      {agents.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--spacing-small)' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td>{agent.name}</td>
                    <td className="align-right">
                      <Button
                        variant="tertiary"
                        size={24}
                        validation="negative"
                        onClick={() => setAgents((prev) => prev.filter((a) => a.id !== agent.id))}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

export default Projects
