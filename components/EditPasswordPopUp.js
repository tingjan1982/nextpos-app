import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form'
import {
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TouchableHighlight,
  AsyncStorage
} from 'react-native'
import { connect } from 'react-redux'
import Icon from 'react-native-vector-icons/Ionicons'
import PinCodeInput from '../components/PinCodeInput'
import { getClientUsr } from '../actions'
import styles from '../styles'

class EditPasswordPopUp extends Component {
  state = {
    isVisible: false,
    refreshing: false
  }

  toggleModal = visible => {
    this.setState({
      isVisible: visible
    })
  }

  ismodalClose = msg => {
    console.log(msg)
  }

  handleChangePwd = updatedPassword => {
    var name = this.props.name
    var newPwd = {}
    newPwd['password'] = updatedPassword

    AsyncStorage.getItem('token', (err, value) => {
      if (err) {
        console.log(err)
      } else {
        JSON.parse(value)
      }
    }).then(val => {
      var tokenObj = JSON.parse(val)
      fetch(`http://35.234.63.193/clients/me/users/${name}/password`, {
        method: 'PATCH',
        withCredentials: true,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          // 'x-client-id': tokenObj.clientId,
          Authorization: 'Bearer ' + tokenObj.access_token
        },
        body: JSON.stringify(newPwd)
      })
        .then(response => response.json())
        .then(res => {
          if (res.username) {
            alert('Successfully updated password')
            this.setState({
              refreshing: false
            })
          }
        })
        .catch(error => {
          console.error(error)
        })
    })
  }

  render() {
    const { onSubmit } = this.props
    return (
      <View>
        <TouchableOpacity
          onPress={() => {
            this.toggleModal(true)
          }}
        >
          <Icon name="md-create" size={22} color="#f18d1a">
            &nbsp;<Text style={{ fontSize: 15 }}>Edit Password</Text>
          </Icon>
        </TouchableOpacity>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.isVisible}
          onRequestClose={() => this.toggleModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContainer}
            onPressOut={() => {
              this.toggleModal(false)
            }}
          >
            <ScrollView
              directionalLockEnabled={true}
              contentContainerStyle={styles.modalContainer}
            >
              <TouchableWithoutFeedback>
                <View
                  style={[styles.whiteBg, styles.boxShadow, styles.popUpLayout]}
                >
                  <Text
                    style={[
                      styles.welcomeText,
                      styles.orange_color,
                      styles.mgrbtn40
                    ]}
                  >
                    Edit Password
                  </Text>

                  <Text style={{ marginBottom: 10, textAlign: 'center' }}>
                    Enter New Password
                  </Text>
                  <View
                    style={[
                      styles.jc_alignIem_center,
                      styles.flex_dir_row,
                      styles.paddLeft20,
                      styles.paddRight20
                    ]}
                  >
                    <Field
                      name="password"
                      component={PinCodeInput}
                      onChange={val => this.handleChangePwd(val)}
                      customHeight={40}
                    />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          </TouchableOpacity>
        </Modal>
      </View>
    )
  }
}
export default EditPasswordPopUp