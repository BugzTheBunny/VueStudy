import { defineStore } from 'pinia'
import supabase from 'src/config/supabase'
import { useShowErrorMessage } from 'src/use/useShowErrorMessage'
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStoreEntries } from 'src/stores/storeEntries'

export const useStoreAuth = defineStore('auth', () => {

  /*
    state
  */
  const userDetails = reactive({
    id: null,
    email: null
  })

  /*
    actions
  */
  const init = () => {
    const router = useRouter(),
          storeEntries = useStoreEntries()

    // Listen for authentication state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session) {
          userDetails.id = session.user.id
          userDetails.email = session.user.email
          router.push('/')
          storeEntries.loadEntries()

        }
      } else if (event === 'SIGNED_OUT') {
          userDetails.id = null
          userDetails.email = null
          router.replace('/auth')
        }
      })
    }

    const registerUser = async ({ email, password }) => {

      let { data, error } = await supabase.auth.signUp({
        email, password
      })

      if (error) {
        useShowErrorMessage(error.message)
      }

      if (data) {
        console.log('User registered successfully:', data)
      }
    }

    const loginUser = async ({ email, password }) => {
      let { data, error } = await supabase.auth.signInWithPassword({
        email, password
      })

      if (error) {
        useShowErrorMessage(error.message)
      }
    }

    const logoutUser = async () => {
      let { error } = await supabase.auth.signOut()

      if (error)
        useShowErrorMessage(error.message)
    }

    /*
      return the store
    */

    return {
      /* state */
      userDetails,

      /* actions */
      init,
      registerUser,
      loginUser,
      logoutUser
    }

})
