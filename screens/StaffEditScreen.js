import React, { Component } from 'react'
import {
  View,
  Text,
  ScrollView,
  AsyncStorage,
  ActivityIndicator
} from 'react-native'
import { connect } from 'react-redux'
import StaffFormScreen from './StaffFormScreen'
import { clearClient, getClientUsr, getClientUsrs } from '../actions'
import styles from '../styles'
import {
  api,
  dispatchFetchRequest,
  errorAlert,
  successMessage
} from '../constants/Backend'

class StaffEditScreen extends Component {
  static navigationOptions = {
    header: null
  }

  state = {
    isEditForm: true
  }

  componentDidMount() {
    this.props.getClientUsr()
  }

  handleEditCancel = () => {
    this.props.clearClient()
    this.props.getClientUsrs()
    this.props.navigation.navigate('StaffsOverview')
  }

  handleUpdate = values => {
    values.isManager === true
      ? (values.roles = ['MANAGER', 'USER'])
      : (values.roles = ['USER'])
    const staffname = this.props.navigation.state.params.staffname

    dispatchFetchRequest(
      api.clientUser.update(staffname),
      {
        method: 'POST',
        withCredentials: true,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      },
      response => {
        successMessage('Saved')
        this.props.navigation.navigate('StaffsOverview')
        this.props.getClientUsrs()
      }
    ).then()
  }

  render() {
    const {
      navigation,
      clientuser,
      clearProduct,
      haveData,
      haveError,
      isLoading
    } = this.props
    const { isEditForm } = this.state

    Array.isArray(clientuser.roles) && clientuser.roles.includes('MANAGER')
      ? (clientuser.isManager = true)
      : (clientuser.isManager = false)

    if (isLoading) {
      return (
        <View style={[styles.container]}>
          <ActivityIndicator size="large" color="#ccc" />
        </View>
      )
    } else if (haveData) {
      return (
        <StaffFormScreen
          isEditForm={isEditForm}
          navigation={navigation}
          initialValues={clientuser}
          handleEditCancel={this.handleEditCancel}
          onSubmit={this.handleUpdate}
        />
      )
    } else {
      return null
    }
  }
}

const mapStateToProps = state => ({
  clientuser: state.clientuser.data,
  haveData: state.clientuser.haveData,
  haveError: state.clientuser.haveError,
  isLoading: state.clientuser.loading
})

const mapDispatchToProps = (dispatch, props) => ({
  dispatch,
  getClientUsr: () =>
    dispatch(getClientUsr(props.navigation.state.params.staffname)),
  clearClient: () => dispatch(clearClient()),
  getClientUsrs: () => dispatch(getClientUsrs())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(StaffEditScreen)
