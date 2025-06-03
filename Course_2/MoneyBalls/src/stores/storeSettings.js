import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'
import { Dark, LocalStorage } from 'quasar'
import { useShowErrorMessage } from 'src/use/useShowErrorMessage'
import { useStoreAuth } from './storeAuth'
import supabase from 'src/config/supabase'
import { store } from 'quasar/wrappers'
export const useStoreSettings = defineStore('settings', () => {

  /*
    state
  */

    const settings = reactive({
      promptToDelete: true,
      showRunningBalance: false,
      currencySymbol: '$',
      darkMode: false // false | true | 'auto'
    })

    // watch darkMode
    watch(() => settings.darkMode, value => {
      Dark.set(value)
    }, { immediate: true })

    // watch settings
    watch(settings, () => {
      saveSettings()
    })

  // profile

  const profile = reactive({
    avatarFile: null,
    avatarURL: null
  })

  /*
    getters
  */



  /*
    actions
  */

    const saveSettings = () => {
      LocalStorage.set('settings', settings)
    }

    const loadSettings = () => {
      const savedSettings = LocalStorage.getItem('settings')
      if (savedSettings) Object.assign(settings, savedSettings)
    }

    const uploadAvatar = async file => {
      const storeAuth = useStoreAuth(),
            folderPath = storeAuth.userDetails.id,
            fileName = `${Date.now()}_${file.name.replaceAll(' ', '_')}`

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(
          `${folderPath}/${fileName}`,
          file
        )

        if (error) useShowErrorMessage(error.message)
        if (data) {
          const avatarFilename = data.fullPath.split('/').pop()
          saveAvatarFilename(avatarFilename)
        }
    }

    const saveAvatarFilename = async avatarFilename => {
      const storeAuth = useStoreAuth()

      const {data,error} = await supabase
      .from('profiles')
      .upsert({
        id:storeAuth.userDetails.id,
        avatar_filename: avatarFilename
      })
      .select()

      if (error) useShowErrorMessage(error.message)

      if (data) {
        getAvatarUrl()
      }
    }

    const getAvatarUrl = async () => {
      const storeAuth = useStoreAuth()

      let { data: profiles , error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', storeAuth.userDetails.id)

      if (error) useShowErrorMessage(error.message)
        if (profiles){
          console.log('profiles', profiles)

          if (profiles[0]?.avatar_filename){
            const avatarFilename = profiles[0].avatar_filename
            profile.avatarURL = `https://tqanmepxsmvhgvsvzcoz.supabase.co/storage/v1/object/public/avatars/${storeAuth.userDetails.id}/${avatarFilename}`
          }
      }
    }


  /*
    return
  */

    return {

      // state
      settings,
      profile,

      // getters

      // actions
      loadSettings,
      uploadAvatar,
      getAvatarUrl,

    }

})
