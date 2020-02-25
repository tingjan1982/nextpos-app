import React from 'react'
import { connect } from 'react-redux'
import { Field, reduxForm, FieldArray } from 'redux-form'
import { ScrollView, Text, View, TouchableOpacity, Image, ActivityIndicator, FlatList, Modal } from 'react-native'
import { DismissKeyboard } from '../components/DismissKeyboard'
import BackBtn from '../components/BackBtn'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import Icon from 'react-native-vector-icons/Ionicons'
import { getTimeCards, getUserTimeCards, formatDate, getMonthName, formatDateObj } from '../actions'
import images from '../assets/images'
import styles from '../styles'
import { LocaleContext } from '../locales/LocaleContext'
import DropDown from '../components/DropDown'
import UserTimeCardsFilterForm from './UserTimeCardsFilterForm'
import { api, dispatchFetchRequest, errorAlert, warningMessage } from '../constants/Backend'

class UserTimeCards extends React.Component {
  static navigationOptions = {
    header: null
  }
  static contextType = LocaleContext

  state = {
  	timecardId: null,
  	filteredUsrTimeCards: []
  }

  handleFilter = (values) => {
  	const month = values.month;
  	const year = values.year;
  	const username = this.props.navigation.state.params.name;

  	if (!month || !year) {
      warningMessage('Please Choose Both Year and Month')
      return
    }

     dispatchFetchRequest(api.timecard.getByMonthYrUsr(year, month, username), {
        method: 'GET',
        withCredentials: true,
        credentials: 'include',
        headers: {}
      },
      response => {
        response.json().then(data => {
          this.setState({filteredUsrTimeCards: data.timeCards})
        })
      }).then()
  }

  componentDidMount() {
  	this.props.getUserTimeCards(this.props.navigation.state.params.name)
  	var defaultVal={
  		year: new Date().getFullYear(),
  		month: getMonthName(new Date().getMonth() + 1),
  		username: this.props.navigation.state.params.name
  	}
  	this.handleFilter(defaultVal)
  }

  render() {
    const { t } = this.context
    const { usertimeCards, haveData, haveError, loading, timeCard } = this.props
    const { filteredUsrTimeCards } = this.state

    Item = ({ timecard }) => {
      const active = timecard.timeCardStatus === 'ACTIVE'

      return (
      	<TouchableOpacity
					onPress={() => {
          	this.props.navigation.navigate('UserTimeCardDetail',{
          		timecardId: timecard.id
          	})
          }}
      		>
        	<View style={[{marginBottom: 10}]}>
          	<View style={[styles.flex_dir_row, styles.paddingTopBtn8]}>
            	<View style={{flex: 1}}>
              	<Text style={{fontWeight: active ? 'bold' : 'normal'}}>
              		{formatDate(timecard.clockIn)}
              	</Text>
            	</View>

            	<View style={{flex: 1}}>
              	<Text style={{textAlign: 'right'}}>
              	 {timecard.hours}&nbsp;{t('timecard.hours')}&nbsp;{timecard.minutes}&nbsp;{t('timecard.minutes')}
              	</Text>
            	</View>
          	</View>
        	</View>
        </TouchableOpacity>
      )
    }

		if (loading) {
      return (
        <View style={[styles.container]}>
          <ActivityIndicator size="large" color="#ccc" />
        </View>
      )
    }
    return (
      <ScrollView>
        <DismissKeyboard>
          <View style={styles.container}>
          	<BackBtn />
            <Text style={styles.screenTitle}>
             {t('userTimeCardTitle')}
						</Text>

            <UserTimeCardsFilterForm
							onSubmit={this.handleFilter}
							displayName={this.props.navigation.state.params.displayName}
            />

						<View style={[styles.mgrtotop20]}>
            	<View style={[styles.flex_dir_row, styles.paddingTopBtn8]}>
              	<View style={{flex: 5}}>
                	<Text style={[styles.orange_color, styles.textBold]}>{t('Day')}</Text>
              	</View>

              	<View style={{flex: 5}}>
                	<Text style={[{textAlign: 'right'}, styles.orange_color, styles.textBold]}>{t('totalHr')}</Text>
              	</View>
            	</View>
            </View>

						<FlatList
              data={filteredUsrTimeCards}
              renderItem={({item, index}) => (
                <Item
                	timecard={item}
                	/>
              )}
              keyExtractor={(item, index) => index.toString()}
            />

          </View>
        </DismissKeyboard>
      </ScrollView>
    )
  }
}

const mapStateToProps = state => ({
  usertimeCards: state.usertimecards.data.timeCards,
  haveData: state.usertimecards.haveData,
  haveError: state.usertimecards.haveError,
  loading: state.usertimecards.loading
})

const mapDispatchToProps = (dispatch, props) => ({
  dispatch,
  getUserTimeCards: () => dispatch(getUserTimeCards(props.navigation.state.params.name)),
  clearTimeCard: () => dispatch(clearTimeCard()),
  getMonthName: () => dispatch(getMonthName())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UserTimeCards)