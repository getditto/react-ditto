import { ReportHandler } from 'web-vitals'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reportWebVitals = (onPerfEntry?: ReportHandler): any => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry)
      getFID(onPerfEntry)
      getFCP(onPerfEntry)
      getLCP(onPerfEntry)
      getTTFB(onPerfEntry)
    })
  }
}

export default reportWebVitals
