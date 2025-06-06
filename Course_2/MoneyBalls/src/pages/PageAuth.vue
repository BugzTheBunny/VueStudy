<template>
  <q-page class="flex flex-center">
    <q-card class="auth bg-primary text-white q-pa-lg">

      <!-- Toolbar -->
      <q-card-section>
        <ToolbarTitle/>
      </q-card-section>

      <q-card-section class="q-pb-none">
        <q-banner
        :class="{'fade-in': entriesCount}"
        class="bg-primary text-white text-center text-italic entries-count"
        >
          <div>Over {{ entriesCount }}</div>
          <div>Created with Moneyballs</div>
        </q-banner>
      </q-card-section>

      <!-- Tabs -->
      <q-card-section>
        <q-tabs v-model="tab">
          <q-tab name="login" label="Login" />
          <q-tab name="register" label="Register" />
        </q-tabs>
      </q-card-section>

      <q-card-section>
        <q-form
          @submit="formSubmit"
        >
          <q-input
            v-model="credentials.email"
            class="q-mb-md"
            filled
            :bg-color="useLightOrDark('white', 'black')"
            type="email"
            label="Email"
            autocomplete="email"
            />

          <q-input
            v-model="credentials.password"
            class="q-mb-md"
            filled
            :bg-color="useLightOrDark('white', 'black')"
            type="password"
            label="Password"
            autocomplete="current-password"
            />

          <q-btn
            class="full-width"
            outline
            color="white"
            type="submit"
            :label="submitButtonTitle"
            no-caps
            />
        </q-form>
      </q-card-section>
    </q-card>
</q-page>
</template>

<script setup>

/*
 imports
*/
import { computed, onMounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import ToolbarTitle from 'src/components/Layout/ToolbarTitle.vue';
import { useLightOrDark } from 'src/use/useLightOrDark';
import { useStoreAuth } from 'src/stores/storeAuth';
import supabase from 'src/config/supabase';
import { useShowErrorMessage } from 'src/use/useShowErrorMessage';

/*
  store
*/
const storeAuth = useStoreAuth();

/*
  quasar
*/

const $q = useQuasar();

/*
  entries count
*/

const entriesCount = ref(null);

onMounted(async ()  => {
  let { data:stats, error } = await supabase
    .from('stats')
    .select('*')
    .eq('name', 'entries_count')

    if (stats) entriesCount.value = stats[0].value;

  if (error) { useShowErrorMessage(error.message); return; }
  });

/*
  Tabs
*/

const tab = ref('register');

/*
  Methods
*/

const submitButtonTitle = computed(() => {
  return tab.value === 'login' ? 'Login' : 'Register';
});

/*
  Form
*/

const credentials = reactive({
  email: '',
  password: ''
});

const formSubmit = () => {
  if (!credentials.email || !credentials.password) {
    $q.dialog({
      type: 'Error',
      message: 'Please fill in all fields.'
    });
    return;
  }
  else {
    formSubmitSuccess();
  }
}

const formSubmitSuccess = () => {
  if (tab.value === 'register') {
    storeAuth.registerUser(credentials)
  } else {
    storeAuth.loginUser(credentials)
  }
};
</script>
