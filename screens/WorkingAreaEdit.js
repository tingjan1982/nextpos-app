import React from 'react'
import {connect} from 'react-redux'
import {View} from 'react-native'
import WorkingAreaForm from './WorkingAreaForm'
import {clearWorkingArea, getPrinters, getWorkingArea, getWorkingAreas} from '../actions'
import {api, dispatchFetchRequest} from '../constants/Backend'
import styles from '../styles'
import {LocaleContext} from '../locales/LocaleContext'
import ScreenHeader from "../components/ScreenHeader";
import LoadingScreen from "./LoadingScreen";
import BackendErrorScreen from "./BackendErrorScreen";
import {ThemeContainer} from "../components/ThemeContainer";

class WorkingAreaEdit extends React.Component {
  static navigationOptions = {
    header: null
  }
  static contextType = LocaleContext

  constructor(props, context) {
    super(props, context)
  }

  componentDidMount() {
    this.props.getWorkingArea(this.props.navigation.state.params.id)
  }

  handleUpdate = values => {
    dispatchFetchRequest(api.workingarea.update(values.id), {
      method: 'POST',
      withCredentials: true,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(values)
    }, response => {
      this.props.navigation.navigate('PrinternKDS')
      this.props.getWorkingAreas()
      this.props.getPrinters()
      this.props.clearWorkingArea()
    }).then()
  }

  handleDelete = (values) => {

    dispatchFetchRequest(api.workingarea.delete(values.id), {
      method: 'DELETE',
      withCredentials: true,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    }, response => {
      this.props.navigation.navigate('PrinternKDS')
      this.props.getWorkingAreas()
      this.props.getPrinters()
      this.props.clearWorkingArea()
    }).then()
  }

  handleEditCancel = () => {
    this.props.clearWorkingArea()
    this.props.getPrinters()
    this.props.getWorkingAreas()
    this.props.navigation.navigate('PrinternKDS')
  }

  render() {
    const {navigation, workingarea, loading, haveError, haveData} = this.props
    const {t} = this.context

    if (loading) {
      return (
        <LoadingScreen />
      )
    } else if (haveError) {
      return (
        <BackendErrorScreen />
      )
    }

    return (
      <ThemeContainer>
        <View style={styles.fullWidthScreen}>
          <ScreenHeader backNavigation={true}
            parentFullScreen={true}
            backAction={() => this.handleEditCancel()}
            title={t('editWorkingAreaTitle')} />

          <WorkingAreaForm
            onSubmit={this.handleUpdate}
            handleDelete={this.handleDelete}
            navigation={navigation}
            initialValues={workingarea}
            isEdit={true}
            dataArr={this.props.navigation.state.params.printers}
            handleEditCancel={this.handleEditCancel}
          />
        </View>
      </ThemeContainer>
    )
  }
}

const mapStateToProps = state => ({
  workingarea: state.workingarea.data,
  haveData: state.workingarea.haveData,
  haveError: state.workingarea.haveError,
  loading: state.workingarea.loading
})

const mapDispatchToProps = (dispatch, props) => ({
  dispatch,
  getWorkingArea: () =>
    dispatch(getWorkingArea(props.navigation.state.params.id)),
  getPrinters: () => dispatch(getPrinters()),
  getWorkingAreas: () => dispatch(getWorkingAreas()),
  clearWorkingArea: () => dispatch(clearWorkingArea())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkingAreaEdit)
