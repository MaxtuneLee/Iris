interface DocumentMetaProps {
  createdAt?: string
  lastModified?: string
}

export function DocumentMeta({ createdAt, lastModified }: DocumentMetaProps) {
  if (!createdAt && !lastModified) {
    return null
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="border-separator-non-opaque mt-12 border-t pt-4 lg:mt-16">
      <div className="py-1">
        <table
          className="text-sm"
          style={{ width: 'auto', minWidth: 0, margin: '0 0' }}
        >
          <tbody>
            {createdAt && (
              <tr>
                <td
                  style={{
                    padding: '0',
                  }}
                  className="text-text-secondary pr-4 align-top font-medium whitespace-nowrap"
                >
                  Created At
                </td>
                <td
                  style={{
                    padding: '0',
                  }}
                >
                  <time
                    dateTime={createdAt}
                    className="text-text-secondary rounded px-2 py-1 font-mono text-xs"
                  >
                    {formatDate(createdAt)}
                  </time>
                </td>
              </tr>
            )}
            {lastModified && (
              <tr>
                <td
                  style={{
                    padding: '0',
                  }}
                  className="text-text-secondary pr-4 align-top font-medium whitespace-nowrap"
                >
                  Last Modified
                </td>
                <td
                  style={{
                    padding: '0',
                  }}
                >
                  <time
                    dateTime={lastModified}
                    className="text-text-secondary rounded px-2 py-1 font-mono text-xs"
                  >
                    {formatDate(lastModified)}
                  </time>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
