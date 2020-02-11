import React from 'react'
import { Field, reduxForm } from 'redux-form'
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableHighlight,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  AsyncStorage,
  RefreshControl,
  FlatList
} from 'react-native'
import { connect } from 'react-redux'
import InputText from '../components/InputText'
import { DismissKeyboard } from '../components/DismissKeyboard'
import BackBtnCustom from '../components/BackBtnCustom'
import AddBtn from '../components/AddBtn'
import Icon from 'react-native-vector-icons/Ionicons'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'
import OrderStart from './OrderStart'
import OrderItem from './OrderItem'
import {
  getTableLayouts,
  getShiftStatus,
  getfetchOrderInflights, getTablesAvailable,
} from '../actions'
import styles from '../styles'
import {
  api,
  makeFetchRequest,
  errorAlert,
  successMessage,
  dispatchFetchRequest
} from '../constants/Backend'
import { LocaleContext } from '../locales/LocaleContext'
import {handleDelete, handleOrderSubmit} from '../helpers/orderActions'
import {NavigationEvents} from "react-navigation";
import {handleOpenShift} from "../helpers/shiftActions";

class TablesScreen extends React.Component {
  static navigationOptions = {
    header: null
  }
  static contextType = LocaleContext

  constructor(props, context) {
    super(props, context)

    this.state = {
      openBalance: 0,
      refreshing: false
    }
  }

  componentDidMount() {
    this.loadInfo()
    this.loadLocalization()
  }

  loadInfo = () => {
    this.props.getTableLayouts()
    this.props.getShiftStatus()
    this.props.getfetchOrderInflights()
    this.props.getAvailableTables()
  }

  loadLocalization = () => {
    this.context.localize({
      en: {
        noTableLayout:
          'You need to define at least one table layout and one table.',
        noInflightOrders: 'No order on this table layout',
        openShift: {
          title: 'Open shift to start sales.',
          openBalance: 'Open Balance',
          open: 'Open',
          cancel: 'Cancel'
        },
        otherOrders: 'Other Orders',
        seatingCapacity: 'Seats',
        availableSeats: 'Vacant'
      },
      zh: {
        noTableLayout: '需要創建至少一個桌面跟一個桌位.',
        noInflightOrders: '此樓面沒有訂單',
        openShift: {
          title: '請開帳來開始銷售',
          openBalance: '開帳現金',
          open: '開帳',
          cancel: '取消'
        },
        otherOrders: '其他訂單',
        seatingCapacity: '座位',
        availableSeats: '空位'
      }
    })
  }

  onRefresh = async () => {
    this.setState({ refreshing: true })

    this.loadInfo()

    this.setState({ refreshing: false }, () => {
      successMessage('Refreshed')
    })
  }

  handleOpenShift = (balance) => {
    handleOpenShift(balance, (response) => {
      successMessage('Shift opened')
      this.loadInfo()
      this.setState({openBalance: 0})
    })
  }

  render() {
    const {
      navigation,
      haveData,
      haveError,
      isLoading,
      tablelayouts,
      shiftStatus,
      ordersInflight,
      availableTables
    } = this.props
    const { t } = this.context

    const floorCapacity = {}

    availableTables && tablelayouts && tablelayouts.forEach((layout, idx) => {
      let capacityCount = 0
      const availableTablesOfLayout = availableTables[layout.id]

      availableTablesOfLayout !== undefined && availableTablesOfLayout.forEach((table, idx2) => {
        capacityCount += table.capacity
      })

      floorCapacity[layout.id] = capacityCount
    })

    if (isLoading) {
      return (
        <View style={[styles.container]}>
          <ActivityIndicator size="large" color="#ccc" />
        </View>
      )
    } else if (tablelayouts === undefined || tablelayouts.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.onRefresh}
            />
          }
        >
          <View style={styles.container}>
            <Text style={styles.messageBlock}>{t('noTableLayout')}</Text>
          </View>
        </ScrollView>
      )
    } else if (shiftStatus === 'INACTIVE') {
      return (
        <View style={styles.container}>
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
                    styles.textMedium,
                    styles.orange_color,
                    styles.mgrbtn40,
                    styles.centerText
                  ]}
                >
                  {t('openShift.title')}
                </Text>
                <View style={styles.fieldContainer}>
                  <Text style={[styles.fieldTitle, { flex: 1 }]}>
                    {t('openShift.openBalance')}
                  </Text>
                  <TextInput
                    name="balance"
                    value={String(this.state.openBalance)}
                    type="text"
                    onChangeText={value =>
                      this.setState({ openBalance: value })
                    }
                    placeholder={t('openShift.openBalance')}
                    keyboardType={`numeric`}
                    style={[styles.rootInput, { flex: 2 }]}
                  />
                </View>
                <View style={[styles.jc_alignIem_center, styles.flex_dir_row]}>
                  <View style={{width: '45%', marginHorizontal: 5}}>
                    <TouchableOpacity onPress={() => this.handleOpenShift(this.state.openBalance)}>
                      <Text style={[styles.bottomActionButton, styles.actionButton]}>
                        {t('openShift.open')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{width: '45%', marginHorizontal: 5}}>
                    <TouchableOpacity
                      onPress={() => {
                        this.props.navigation.navigate('LoginSuccess')
                      }}
                    >
                      <Text style={[styles.bottomActionButton, styles.cancelButton]}>
                        {t('openShift.cancel')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </View>
      )
    }

    return (
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this.onRefresh}
          />
        }
      >
        <NavigationEvents
          onWillFocus={() => {
            this.loadInfo()
            this.loadLocalization()
          }}
        />

        <DismissKeyboard>
          <View>
            <View style={[styles.container, styles.nomgrBottom]}>
              <BackBtnCustom
                onPress={() => this.props.navigation.navigate('LoginSuccess')}
              />
              <Text style={styles.screenTitle}>{t('menu.tables')}</Text>
              <AddBtn
                onPress={() =>
                  this.props.navigation.navigate('OrderStart', {
                    handleOrderSubmit: handleOrderSubmit,
                    handleDelete: handleDelete
                  })
                }
              />
            </View>

            {tablelayouts.map((tblLayout, idx) => (
              <View style={styles.mgrbtn20} key={idx}>
                <View style={[styles.sectionBar, {flex: 1, paddingLeft:20, paddingRight: 20}]}>
                  <Text
                    style={[styles.sectionBarText, {flex: 4, textAlign: 'left'}
                    ]}
                  >
                    {tblLayout.layoutName}
                  </Text>
                  <Text style={[styles.sectionBarText, {flex: 4.2, textAlign: 'right', marginRight: 4}]}>
                    {t('seatingCapacity')} {tblLayout.totalCapacity}
                  </Text>
                  <Text style={[styles.sectionBarText, {flex: 2.8, textAlign: 'right'}]}>
                    {t('availableSeats')} {floorCapacity[tblLayout.id]}
                  </Text>
                </View>
                {ordersInflight !== undefined && ordersInflight[tblLayout.id] !== undefined ? (
                  <FlatList
                    data={ordersInflight[tblLayout.id]}
                    renderItem={({ item }) => {
                      return (
                        <OrderItem
                          order={item}
                          navigation={navigation}
                          handleOrderSubmit={handleOrderSubmit}
                          handleDelete={handleDelete}
                          key={item.orderId}
                        />
                      )
                    }}
                    keyExtractor={(item, idx) => item.orderId}
                  />
                ) : (
                  <View>
                    <Text style={styles.messageBlock}>
                      {t('noInflightOrders')}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            <View style={styles.mgrbtn20} key='noLayout'>
              <View style={[styles.sectionBar, {flex: 1}]}>
                <Text
                  style={[styles.sectionBarText, {textAlign: 'center'}
                  ]}
                >
                  {t('otherOrders')}
                </Text>
              </View>
              {ordersInflight !== undefined && ordersInflight['NO_LAYOUT'] !== undefined ? (
                <FlatList
                  data={ordersInflight['NO_LAYOUT']}
                  renderItem={({ item }) => {
                    return (
                      <OrderItem
                        order={item}
                        navigation={navigation}
                        handleOrderSubmit={handleOrderSubmit}
                        handleDelete={handleDelete}
                        key={item.orderId}
                      />
                    )
                  }}
                  keyExtractor={(item, idx) => item.orderId}
                />
              ) : (
                <View>
                  <Text style={styles.messageBlock}>
                    {t('noInflightOrders')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </DismissKeyboard>
      </ScrollView>
    )
  }
}

const mapStateToProps = state => ({
  reduxState: state,
  tablelayouts: state.tablelayouts.data.tableLayouts,
  ordersInflight: state.ordersinflight.data.orders,
  haveData: state.ordersinflight.haveData,
  haveError: state.ordersinflight.haveError,
  isLoading: state.ordersinflight.loading,
  shiftStatus: state.shift.data.shiftStatus,
  availableTables: state.tablesavailable.data.availableTables
})

const mapDispatchToProps = (dispatch, props) => ({
  dispatch,
  getfetchOrderInflights: () => dispatch(getfetchOrderInflights()),
  getTableLayouts: () => dispatch(getTableLayouts()),
  getShiftStatus: () => dispatch(getShiftStatus()),
  getAvailableTables: () => dispatch(getTablesAvailable())
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TablesScreen)
