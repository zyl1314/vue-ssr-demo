import { createApp } from './app'

export default context => {

    const { app, router } = createApp()
    router.push(context.url)

    const matchedComponents = router.getMatchedComponents()
    if (!matchedComponents.length) return({code: 404})

	return app
}