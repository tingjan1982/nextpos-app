import React from 'react'
import { connect } from 'react-redux'
import {
  AsyncStorage,
  View,
  Text,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import { Accordion, List, SwipeAction } from '@ant-design/react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import {
  getTableLayout,
  clearTableLayout,
  getfetchOrderInflights
} from '../actions'
import AddBtn from '../components/AddBtn'
import BackBtn from '../components/BackBtn'
import { DismissKeyboard } from '../components/DismissKeyboard'
import TableForm from './TableForm'
import {api, makeFetchRequest, errorAlert, dispatchFetchRequest, successMessage} from '../constants/Backend'
import styles from '../styles'
import { LocaleContext } from '../locales/LocaleContext'

class TableEdit extends React.Component {
  static navigationOptions = {
    header: null
  }
  static contextType = LocaleContext

  constructor(props, context) {
    super(props, context)

    this.state = {
      t: context.t
    }
  }

  componentDidMount() {
    this.props.getTableLayout(this.props.navigation.state.params.layoutId)
  }

  handleSubmit = values => {
    const tablelayoutId = this.props.navigation.state.params.layoutId
    const tableId = this.props.navigation.state.params.tableId

    dispatchFetchRequest(api.tablelayout.updateTable(tablelayoutId, tableId), {
      method: 'POST',
      withCredentials: true,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values)
    }, response => {
      this.props.navigation.navigate('TableLayoutEdit', {
        layoutId: tablelayoutId
      })
      this.props.getTableLayout(tablelayoutId)
    }).then()
  }

  handleDeleteTable = (layoutId, tableId) => {
    dispatchFetchRequest(api.tablelayout.deleteTable(layoutId, tableId), {
      method: 'DELETE',
      withCredentials: true,
      credentials: 'include',
      headers: {},
    }, response => {
      successMessage('Table deleted')
      this.props.navigation.navigate('TableLayouts')
    }).then()
  }

  render() {
    const {
      navigation,
      tablelayout,
      haveData,
      haveError,
      isLoading
    } = this.props
    const { t } = this.state

    const selectedTable = tablelayout !== undefined && tablelayout.tables !== undefined && tablelayout.tables.find(
      table => table.tableId === this.props.navigation.state.params.tableId
    )

    if (isLoading) {
      return (
        <View style={[styles.container]}>
          <ActivityIndicator size="large" color="#ccc" />
        </View>
      )
    } else if (haveData && selectedTable !== undefined) {
      return (
        <DismissKeyboard>
          <View style={[styles.container_nocenterCnt]}>
            <View>
              <BackBtn/>
              <Text style={styles.screenTitle}>{t('editTableTitle')}</Text>
            </View>
            <TableForm
              onSubmit={this.handleSubmit}
              handleDeleteTable={this.handleDeleteTable}
              initialValues={selectedTable}
              isEdit={true}
              tableLayout={tablelayout}
              navigation={navigation}
            />
          </View>
        </DismissKeyboard>
      )
    } else {
      return null
    }
  }
}

const mapStateToProps = state => ({
  tablelayout: state.tablelayout.data,
  haveData: state.tablelayout.haveData,
  haveError: state.tablelayout.haveError,
  isLoading: state.tablelayout.loading
})

const mapDispatchToProps = dispatch => ({
  dispatch,
  getTableLayout: id => dispatch(getTableLayout(id)),
  clearTableLayout: id => dispatch(clearTableLayout(id))
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TableEdit)
