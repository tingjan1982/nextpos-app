import React from 'react'
import { AsyncStorage, View } from 'react-native'
import { connect } from 'react-redux'
import { encode as btoa } from 'base-64'
import { doLoggedIn } from '../actions'
import LoginScreen from './LoginScreen'
import LoginSuccessScreen from './LoginSuccessScreen'
import HomeScreen from './HomeScreen'

class Login extends React.Component {
  static navigationOptions = {
    header: null
  }

  state = {
    isLoggedIn: false
  }

  handleSubmit = values => {
    const formData = new FormData()
    formData.append('grant_type', 'client_credentials')
    var auth = 'Basic ' + btoa(values.username + ':' + values.masterPassword)

    fetch('http://35.234.63.193/oauth/token', {
      method: 'POST',
      withCredentials: true,
      credentials: 'include',
      headers: {
        Authorization: auth
      },
      body: formData
    })
      .then(response => response.json())
      .then(res => {
        if (res.error) {
          alert(res.error)
        } else {
          var tokenexpiration = new Date().setSeconds(
            new Date().getSeconds() + parseInt(3599)
          )
          res.tokenExp = tokenexpiration
          AsyncStorage.setItem('token', JSON.stringify(res))

          AsyncStorage.getItem('token', (err, value) => {
            if (err) {
              console.log(err)
            } else {
              return JSON.parse(value)
            }
          }).then(val => {
            var tokenObj = JSON.parse(val)
            var accessToken = tokenObj.access_token
            this.props.dispatch(doLoggedIn(accessToken))
          })
        }
        return res
      })
      .catch(error => console.log(error))
  }

  render() {
    const { isLoggedIn, navigation } = this.props

    if (isLoggedIn) {
      return <LoginSuccessScreen navigation={navigation} />
    } else {
      return <LoginScreen onSubmit={this.handleSubmit} />
    }
  }
}

const mapStateToProps = state => ({
  isLoggedIn: state.auth.isLoggedIn
})

const mapDispatchToProps = dispatch => ({
  dispatch,
  doLoggedIn: () => {
    dispatch(doLoggedIn())
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login)
