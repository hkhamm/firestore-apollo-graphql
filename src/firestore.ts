import admin from 'firebase-admin'
import serviceAccount from './service-account.json'

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
})

const firestore = admin.firestore()
firestore.settings({ timestampsInSnapshots: true })

export default firestore
