import React, {Component} from 'react'
import {Modal, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import styles, {mainThemeColor} from '../styles'
import {LocaleContext} from '../locales/LocaleContext'
import {ThemeContainer} from "./ThemeContainer";
import {withContext} from "../helpers/contextHelper";
import {Field, reduxForm} from 'redux-form'
import RenderStepper from './RenderStepper'
import {isCountZero, isRequired} from '../validators'
import {api, dispatchFetchRequest, dispatchFetchRequestWithOption} from '../constants/Backend'

class PopUpBase extends Component {
  static contextType = LocaleContext

  constructor(props, context) {
    super(props, context)

    this.state = {
      isVisible: false
    }
  }

  toggleModal = visible => {
    this.setState({
      isVisible: visible
    })
  }

  render() {
    const {
      toRoute1,
      toRoute2,
      textForRoute1,
      textForRoute2,
      navigation,
      dataArr,
      themeStyle
    } = this.props
    const {t} = this.context

    return (
      <ThemeContainer>
        <TouchableOpacity
          onPress={() => {
            this.toggleModal(true)
          }}
        >
          <Icon name="md-add" size={32} color={mainThemeColor} />
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
              contentContainerStyle={[styles.modalContainer, {width: '100%'}]}
            >
              <TouchableWithoutFeedback>
                <View style={[styles.boxShadow, styles.popUpLayout, themeStyle]}>
                  <Text
                    style={[
                      styles.welcomeText,
                      styles.orange_color,
                      styles.mgrbtn40
                    ]}
                  >
                    {t('newItem.new')}
                  </Text>
                  <View
                    style={[styles.jc_alignIem_center, styles.flex_dir_row, {width: '100%'}]}
                  >
                    <View
                      style={{flex: 1, marginHorizontal: 5}}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          navigation.navigate(toRoute1)
                          this.toggleModal(false)
                        }}
                      >
                        <Text style={[styles.bottomActionButton, styles.actionButton]}>
                          {textForRoute1}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View
                      style={{flex: 1, marginHorizontal: 5}}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          navigation.navigate(toRoute2, {
                            dataArr: dataArr
                          })
                          this.toggleModal(false)
                        }}
                      >
                        <Text style={[styles.bottomActionButton, styles.actionButton]}>{textForRoute2}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          </TouchableOpacity>
        </Modal>
      </ThemeContainer>
    )
  }
}


/*
   Date   : 2020-10-22
   Author : GGGODLIN
   Content: props
                title={""}
                toRoute={[]}
                textForRoute={[]}
                dataArr={[]}
                navigation={this.props.navigation}
                params={[{},{}]}
*/
export const PopUp = withContext(PopUpBase)

class CustomPopUpBase extends Component {
  static contextType = LocaleContext

  constructor(props, context) {
    super(props, context)

    this.state = {
      isVisible: false
    }
  }

  toggleModal = visible => {
    this.setState({
      isVisible: visible
    })
  }

  render() {
    const {
      toRoute,
      textForRoute,
      navigation,
      dataArr,
      themeStyle,
      params
    } = this.props
    const {t, isTablet} = this.context

    return (
      <ThemeContainer>
        <TouchableOpacity
          onPress={() => {
            this.toggleModal(true)
          }}
        >
          <Icon name="md-add" size={32} color={mainThemeColor} />
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
              contentContainerStyle={[styles.modalContainer, {width: '100%'}]}
            >
              <TouchableWithoutFeedback>
                <View style={[styles.boxShadow, styles.popUpLayout, themeStyle]}>
                  <Text
                    style={[
                      styles.welcomeText,
                      styles.orange_color,
                      styles.mgrbtn40
                    ]}
                  >
                    {this.props?.title ?? t('newItem.new')}
                  </Text>
                  <View
                    style={[styles.jc_alignIem_center, styles.flex_dir_row, {width: `${isTablet ? '50%' : '100%'}`, flexWrap: 'wrap'}]}
                  >
                    {toRoute?.map((item, index, array) => {
                      return (
                        <View
                          style={{width: '100%', paddingHorizontal: 5}}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              let par = params?.[index] ?? {}
                              navigation.navigate(item, {
                                ...par,
                                dataArr: dataArr?.[index] ?? null
                              })
                              this.toggleModal(false)
                            }}
                          >
                            <Text style={[styles.bottomActionButton, styles.actionButton]}>
                              {textForRoute?.[index] ?? 'no text'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )
                    })}

                  </View>
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          </TouchableOpacity>
        </Modal>
      </ThemeContainer>
    )
  }
}

export const CustomPopUp = withContext(CustomPopUpBase)

class SplitBillPopUpBase extends Component {
  static contextType = LocaleContext

  constructor(props, context) {
    super(props, context)



    this.state = {
      quantity: 1,
      showHeadCount: false
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (!prevProps?.isVisible && !!this.props?.isVisible) {
      this.getSplitBillByHeadCount(this.props?.orderId)
    }
  }
  componentDidMount() {
    this.getSplitBillByHeadCount(this.props?.orderId)
  }
  toggleModal = visible => {
    this.props?.toggleModal(visible)
  }

  getSplitBillByHeadCount = (id) => {
    dispatchFetchRequestWithOption(
      api.splitOrder.splitByHead(id),
      {
        method: 'GET',
        withCredentials: true,
        credentials: 'include',
        headers: {'Content-Type': 'application/json', },

      }, {
      defaultMessage: false
    },
      response => {
        response.json().then(data => {

          let isPaid = data?.splitAmounts?.filter((item) => item?.paid)?.length > 0
          console.log('getSplitBillByHeadCount', data, isPaid)
          if (data?.headCount >= 2 && isPaid) {
            this.setState({showHeadCount: true})
            this.props?.change('quantity', data?.headCount)
          } else {
            this.setState({showHeadCount: false})
            this.props?.reset()
          }

        })
      },
      response => {

      }
    ).then()
  }

  render() {
    const {
      toRoute,
      textForRoute,
      navigation,
      dataArr,
      themeStyle,
      params,
      handleSubmit
    } = this.props
    const {t, isTablet} = this.context

    return (


      <Modal
        animationType="fade"
        transparent={true}
        visible={this.props?.isVisible}
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
            contentContainerStyle={[styles.modalContainer, {width: '100%'}]}
          >
            <TouchableWithoutFeedback>
              <View style={[styles.boxShadow, styles.popUpLayout, themeStyle]}>
                <Text
                  style={[
                    styles.welcomeText,
                    styles.orange_color,
                    styles.mgrbtn40
                  ]}
                >
                  {this.props?.title ?? t('newItem.new')}
                </Text>

                <View
                  style={[styles.jc_alignIem_center, styles.flex_dir_row, {width: `${isTablet ? '50%' : '100%'}`, flexWrap: 'wrap'}]}
                >
                  {this.state?.showHeadCount && <View >
                    <Field
                      name="quantity"
                      component={RenderStepper}
                      optionName={t('splitBillPopUp.quantity')}
                      validate={[isRequired, isCountZero]}
                    />
                  </View>}
                  {this.state?.showHeadCount || toRoute?.map((item, index, array) => {
                    return (
                      <View
                        style={{width: '100%', paddingHorizontal: 5}}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            if (item === 'SplitBillByHeadScreen' && !this.state?.showHeadCount) {
                              this.setState({showHeadCount: true})
                            } else {
                              let par = params?.[index] ?? {}
                              navigation.navigate(item, {
                                ...par,
                                dataArr: dataArr?.[index] ?? null
                              })
                              this.toggleModal(false)
                            }
                          }}
                        >
                          <Text style={[styles.bottomActionButton, styles.actionButton]}>
                            {textForRoute?.[index] ?? 'no text'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )
                  })}

                  {this.state?.showHeadCount && <View
                    style={{width: '100%', paddingHorizontal: 5, paddingTop: 10}}
                  >
                    <TouchableOpacity
                      onPress={handleSubmit(data => {
                        //此處高度客製化，無泛用性
                        navigation.navigate(toRoute[1], {
                          ...params?.[1],
                          headCount: data?.quantity
                        })
                        this.toggleModal(false)
                      })}
                    >
                      <Text style={[styles.bottomActionButton, styles.actionButton]}>
                        {t('splitBillPopUp.ok')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        this.toggleModal(false)
                      }}
                    >
                      <Text style={[styles.bottomActionButton, styles.cancelButton]}>
                        {t('action.cancel')}
                      </Text>
                    </TouchableOpacity>
                  </View>}

                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </TouchableOpacity>
      </Modal>

    )
  }
}

SplitBillPopUpBase = reduxForm({
  form: 'SplitBillPopUpBase'
})(SplitBillPopUpBase)

export const SplitBillPopUp = withContext(SplitBillPopUpBase)
