import {boot} from 'quasar/wrappers';
import { useStoreAuth } from 'src/stores/storeAuth'
export default boot(({ router,store }) => {
  router.beforeEach((to, from) => {
    const storeAuth = useStoreAuth()

    if (!storeAuth.userDetails.id && to.path !== '/auth') {
      return { path: '/auth' }
    }

    if (storeAuth.userDetails.id && to.path === '/auth') {
      return false
    }
  })
})
