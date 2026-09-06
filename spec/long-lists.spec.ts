import { smartModule } from '../src/smartModule'
import type { Spread, Unbox } from '../src/utils/type-helpers'
import type { TypeTest, ExpectedFactoryType } from './utils/spec-helpers'
import { matchExpectedModuleStructure, matchExpectedConfigModule, typeAssert } from './utils/spec-helpers'

// Sixty entries, because the list-walking types used to fall over at forty-seven:
// `Spread`, `InferSmartEntities` and `UnboxSmartConfigPropsArray` all peeled a tuple
// head by tail, one nested instantiation per element, and TypeScript gives that up
// at about fifty with TS2589 (measured: forty-seven smart imports or inline configs,
// forty-nine object types through `Spread` alone). A tail-recursive accumulator and
// homomorphic mapped types have no such ceiling, and this file is what keeps them
// that way.
describe('Long lists', () => {
  class Config01 {
    prop01: string
  }
  class Config02 {
    prop02: string
  }
  class Config03 {
    prop03: string
  }
  class Config04 {
    prop04: string
  }
  class Config05 {
    prop05: string
  }
  class Config06 {
    prop06: string
  }
  class Config07 {
    prop07: string
  }
  class Config08 {
    prop08: string
  }
  class Config09 {
    prop09: string
  }
  class Config10 {
    prop10: string
  }
  class Config11 {
    prop11: string
  }
  class Config12 {
    prop12: string
  }
  class Config13 {
    prop13: string
  }
  class Config14 {
    prop14: string
  }
  class Config15 {
    prop15: string
  }
  class Config16 {
    prop16: string
  }
  class Config17 {
    prop17: string
  }
  class Config18 {
    prop18: string
  }
  class Config19 {
    prop19: string
  }
  class Config20 {
    prop20: string
  }
  class Config21 {
    prop21: string
  }
  class Config22 {
    prop22: string
  }
  class Config23 {
    prop23: string
  }
  class Config24 {
    prop24: string
  }
  class Config25 {
    prop25: string
  }
  class Config26 {
    prop26: string
  }
  class Config27 {
    prop27: string
  }
  class Config28 {
    prop28: string
  }
  class Config29 {
    prop29: string
  }
  class Config30 {
    prop30: string
  }
  class Config31 {
    prop31: string
  }
  class Config32 {
    prop32: string
  }
  class Config33 {
    prop33: string
  }
  class Config34 {
    prop34: string
  }
  class Config35 {
    prop35: string
  }
  class Config36 {
    prop36: string
  }
  class Config37 {
    prop37: string
  }
  class Config38 {
    prop38: string
  }
  class Config39 {
    prop39: string
  }
  class Config40 {
    prop40: string
  }
  class Config41 {
    prop41: string
  }
  class Config42 {
    prop42: string
  }
  class Config43 {
    prop43: string
  }
  class Config44 {
    prop44: string
  }
  class Config45 {
    prop45: string
  }
  class Config46 {
    prop46: string
  }
  class Config47 {
    prop47: string
  }
  class Config48 {
    prop48: string
  }
  class Config49 {
    prop49: string
  }
  class Config50 {
    prop50: string
  }
  class Config51 {
    prop51: string
  }
  class Config52 {
    prop52: string
  }
  class Config53 {
    prop53: string
  }
  class Config54 {
    prop54: string
  }
  class Config55 {
    prop55: string
  }
  class Config56 {
    prop56: string
  }
  class Config57 {
    prop57: string
  }
  class Config58 {
    prop58: string
  }
  class Config59 {
    prop59: string
  }
  class Config60 {
    prop60: string
  }

  type AllProps = {
    prop01: string
    prop02: string
    prop03: string
    prop04: string
    prop05: string
    prop06: string
    prop07: string
    prop08: string
    prop09: string
    prop10: string
    prop11: string
    prop12: string
    prop13: string
    prop14: string
    prop15: string
    prop16: string
    prop17: string
    prop18: string
    prop19: string
    prop20: string
    prop21: string
    prop22: string
    prop23: string
    prop24: string
    prop25: string
    prop26: string
    prop27: string
    prop28: string
    prop29: string
    prop30: string
    prop31: string
    prop32: string
    prop33: string
    prop34: string
    prop35: string
    prop36: string
    prop37: string
    prop38: string
    prop39: string
    prop40: string
    prop41: string
    prop42: string
    prop43: string
    prop44: string
    prop45: string
    prop46: string
    prop47: string
    prop48: string
    prop49: string
    prop50: string
    prop51: string
    prop52: string
    prop53: string
    prop54: string
    prop55: string
    prop56: string
    prop57: string
    prop58: string
    prop59: string
    prop60: string
  }

  const allProps = {
    prop01: 'value01',
    prop02: 'value02',
    prop03: 'value03',
    prop04: 'value04',
    prop05: 'value05',
    prop06: 'value06',
    prop07: 'value07',
    prop08: 'value08',
    prop09: 'value09',
    prop10: 'value10',
    prop11: 'value11',
    prop12: 'value12',
    prop13: 'value13',
    prop14: 'value14',
    prop15: 'value15',
    prop16: 'value16',
    prop17: 'value17',
    prop18: 'value18',
    prop19: 'value19',
    prop20: 'value20',
    prop21: 'value21',
    prop22: 'value22',
    prop23: 'value23',
    prop24: 'value24',
    prop25: 'value25',
    prop26: 'value26',
    prop27: 'value27',
    prop28: 'value28',
    prop29: 'value29',
    prop30: 'value30',
    prop31: 'value31',
    prop32: 'value32',
    prop33: 'value33',
    prop34: 'value34',
    prop35: 'value35',
    prop36: 'value36',
    prop37: 'value37',
    prop38: 'value38',
    prop39: 'value39',
    prop40: 'value40',
    prop41: 'value41',
    prop42: 'value42',
    prop43: 'value43',
    prop44: 'value44',
    prop45: 'value45',
    prop46: 'value46',
    prop47: 'value47',
    prop48: 'value48',
    prop49: 'value49',
    prop50: 'value50',
    prop51: 'value51',
    prop52: 'value52',
    prop53: 'value53',
    prop54: 'value54',
    prop55: 'value55',
    prop56: 'value56',
    prop57: 'value57',
    prop58: 'value58',
    prop59: 'value59',
    prop60: 'value60',
  }

  it('should spread sixty object types into one', () => {
    typeAssert<
      TypeTest<
        Unbox<
          Spread<
            [
              Pick<Config01, 'prop01'>,
              Pick<Config02, 'prop02'>,
              Pick<Config03, 'prop03'>,
              Pick<Config04, 'prop04'>,
              Pick<Config05, 'prop05'>,
              Pick<Config06, 'prop06'>,
              Pick<Config07, 'prop07'>,
              Pick<Config08, 'prop08'>,
              Pick<Config09, 'prop09'>,
              Pick<Config10, 'prop10'>,
              Pick<Config11, 'prop11'>,
              Pick<Config12, 'prop12'>,
              Pick<Config13, 'prop13'>,
              Pick<Config14, 'prop14'>,
              Pick<Config15, 'prop15'>,
              Pick<Config16, 'prop16'>,
              Pick<Config17, 'prop17'>,
              Pick<Config18, 'prop18'>,
              Pick<Config19, 'prop19'>,
              Pick<Config20, 'prop20'>,
              Pick<Config21, 'prop21'>,
              Pick<Config22, 'prop22'>,
              Pick<Config23, 'prop23'>,
              Pick<Config24, 'prop24'>,
              Pick<Config25, 'prop25'>,
              Pick<Config26, 'prop26'>,
              Pick<Config27, 'prop27'>,
              Pick<Config28, 'prop28'>,
              Pick<Config29, 'prop29'>,
              Pick<Config30, 'prop30'>,
              Pick<Config31, 'prop31'>,
              Pick<Config32, 'prop32'>,
              Pick<Config33, 'prop33'>,
              Pick<Config34, 'prop34'>,
              Pick<Config35, 'prop35'>,
              Pick<Config36, 'prop36'>,
              Pick<Config37, 'prop37'>,
              Pick<Config38, 'prop38'>,
              Pick<Config39, 'prop39'>,
              Pick<Config40, 'prop40'>,
              Pick<Config41, 'prop41'>,
              Pick<Config42, 'prop42'>,
              Pick<Config43, 'prop43'>,
              Pick<Config44, 'prop44'>,
              Pick<Config45, 'prop45'>,
              Pick<Config46, 'prop46'>,
              Pick<Config47, 'prop47'>,
              Pick<Config48, 'prop48'>,
              Pick<Config49, 'prop49'>,
              Pick<Config50, 'prop50'>,
              Pick<Config51, 'prop51'>,
              Pick<Config52, 'prop52'>,
              Pick<Config53, 'prop53'>,
              Pick<Config54, 'prop54'>,
              Pick<Config55, 'prop55'>,
              Pick<Config56, 'prop56'>,
              Pick<Config57, 'prop57'>,
              Pick<Config58, 'prop58'>,
              Pick<Config59, 'prop59'>,
              Pick<Config60, 'prop60'>,
            ]
          >
        >,
        AllProps
      >
    >()
  })

  it('should import sixty smart modules and require every config prop', () => {
    const factory01 = smartModule({ smartConfigs: [Config01] })
    const factory02 = smartModule({ smartConfigs: [Config02] })
    const factory03 = smartModule({ smartConfigs: [Config03] })
    const factory04 = smartModule({ smartConfigs: [Config04] })
    const factory05 = smartModule({ smartConfigs: [Config05] })
    const factory06 = smartModule({ smartConfigs: [Config06] })
    const factory07 = smartModule({ smartConfigs: [Config07] })
    const factory08 = smartModule({ smartConfigs: [Config08] })
    const factory09 = smartModule({ smartConfigs: [Config09] })
    const factory10 = smartModule({ smartConfigs: [Config10] })
    const factory11 = smartModule({ smartConfigs: [Config11] })
    const factory12 = smartModule({ smartConfigs: [Config12] })
    const factory13 = smartModule({ smartConfigs: [Config13] })
    const factory14 = smartModule({ smartConfigs: [Config14] })
    const factory15 = smartModule({ smartConfigs: [Config15] })
    const factory16 = smartModule({ smartConfigs: [Config16] })
    const factory17 = smartModule({ smartConfigs: [Config17] })
    const factory18 = smartModule({ smartConfigs: [Config18] })
    const factory19 = smartModule({ smartConfigs: [Config19] })
    const factory20 = smartModule({ smartConfigs: [Config20] })
    const factory21 = smartModule({ smartConfigs: [Config21] })
    const factory22 = smartModule({ smartConfigs: [Config22] })
    const factory23 = smartModule({ smartConfigs: [Config23] })
    const factory24 = smartModule({ smartConfigs: [Config24] })
    const factory25 = smartModule({ smartConfigs: [Config25] })
    const factory26 = smartModule({ smartConfigs: [Config26] })
    const factory27 = smartModule({ smartConfigs: [Config27] })
    const factory28 = smartModule({ smartConfigs: [Config28] })
    const factory29 = smartModule({ smartConfigs: [Config29] })
    const factory30 = smartModule({ smartConfigs: [Config30] })
    const factory31 = smartModule({ smartConfigs: [Config31] })
    const factory32 = smartModule({ smartConfigs: [Config32] })
    const factory33 = smartModule({ smartConfigs: [Config33] })
    const factory34 = smartModule({ smartConfigs: [Config34] })
    const factory35 = smartModule({ smartConfigs: [Config35] })
    const factory36 = smartModule({ smartConfigs: [Config36] })
    const factory37 = smartModule({ smartConfigs: [Config37] })
    const factory38 = smartModule({ smartConfigs: [Config38] })
    const factory39 = smartModule({ smartConfigs: [Config39] })
    const factory40 = smartModule({ smartConfigs: [Config40] })
    const factory41 = smartModule({ smartConfigs: [Config41] })
    const factory42 = smartModule({ smartConfigs: [Config42] })
    const factory43 = smartModule({ smartConfigs: [Config43] })
    const factory44 = smartModule({ smartConfigs: [Config44] })
    const factory45 = smartModule({ smartConfigs: [Config45] })
    const factory46 = smartModule({ smartConfigs: [Config46] })
    const factory47 = smartModule({ smartConfigs: [Config47] })
    const factory48 = smartModule({ smartConfigs: [Config48] })
    const factory49 = smartModule({ smartConfigs: [Config49] })
    const factory50 = smartModule({ smartConfigs: [Config50] })
    const factory51 = smartModule({ smartConfigs: [Config51] })
    const factory52 = smartModule({ smartConfigs: [Config52] })
    const factory53 = smartModule({ smartConfigs: [Config53] })
    const factory54 = smartModule({ smartConfigs: [Config54] })
    const factory55 = smartModule({ smartConfigs: [Config55] })
    const factory56 = smartModule({ smartConfigs: [Config56] })
    const factory57 = smartModule({ smartConfigs: [Config57] })
    const factory58 = smartModule({ smartConfigs: [Config58] })
    const factory59 = smartModule({ smartConfigs: [Config59] })
    const factory60 = smartModule({ smartConfigs: [Config60] })

    const factory = smartModule({
      smartImports: [
        factory01,
        factory02,
        factory03,
        factory04,
        factory05,
        factory06,
        factory07,
        factory08,
        factory09,
        factory10,
        factory11,
        factory12,
        factory13,
        factory14,
        factory15,
        factory16,
        factory17,
        factory18,
        factory19,
        factory20,
        factory21,
        factory22,
        factory23,
        factory24,
        factory25,
        factory26,
        factory27,
        factory28,
        factory29,
        factory30,
        factory31,
        factory32,
        factory33,
        factory34,
        factory35,
        factory36,
        factory37,
        factory38,
        factory39,
        factory40,
        factory41,
        factory42,
        factory43,
        factory44,
        factory45,
        factory46,
        factory47,
        factory48,
        factory49,
        factory50,
        factory51,
        factory52,
        factory53,
        factory54,
        factory55,
        factory56,
        factory57,
        factory58,
        factory59,
        factory60,
      ],
    })

    typeAssert<TypeTest<typeof factory, ExpectedFactoryType<AllProps>>>()

    const module = factory(allProps)

    matchExpectedModuleStructure(module, { imports: 60 })
    matchExpectedModuleStructure(module.imports![0] as Parameters<typeof matchExpectedModuleStructure>[0], {
      imports: 1,
    })
    matchExpectedConfigModule((module.imports![0] as { imports: unknown[] }).imports[0], {
      name: 'Config01SmartConfigModule',
      value: allProps,
    })
    matchExpectedConfigModule((module.imports![59] as { imports: unknown[] }).imports[0], {
      name: 'Config60SmartConfigModule',
      value: allProps,
    })
  })

  it('should take sixty smart configs and require every config prop', () => {
    const factory = smartModule({
      smartConfigs: [
        Config01,
        Config02,
        Config03,
        Config04,
        Config05,
        Config06,
        Config07,
        Config08,
        Config09,
        Config10,
        Config11,
        Config12,
        Config13,
        Config14,
        Config15,
        Config16,
        Config17,
        Config18,
        Config19,
        Config20,
        Config21,
        Config22,
        Config23,
        Config24,
        Config25,
        Config26,
        Config27,
        Config28,
        Config29,
        Config30,
        Config31,
        Config32,
        Config33,
        Config34,
        Config35,
        Config36,
        Config37,
        Config38,
        Config39,
        Config40,
        Config41,
        Config42,
        Config43,
        Config44,
        Config45,
        Config46,
        Config47,
        Config48,
        Config49,
        Config50,
        Config51,
        Config52,
        Config53,
        Config54,
        Config55,
        Config56,
        Config57,
        Config58,
        Config59,
        Config60,
      ],
    })

    typeAssert<TypeTest<typeof factory, ExpectedFactoryType<AllProps>>>()

    const module = factory(allProps)

    matchExpectedModuleStructure(module, { imports: 60 })
    matchExpectedConfigModule(module.imports![0], { name: 'Config01SmartConfigModule', value: allProps })
    matchExpectedConfigModule(module.imports![59], { name: 'Config60SmartConfigModule', value: allProps })
  })

  it('should hand sixty inline configs to a module definition factory, each one typed', () => {
    const factory = smartModule(
      Config01,
      Config02,
      Config03,
      Config04,
      Config05,
      Config06,
      Config07,
      Config08,
      Config09,
      Config10,
      Config11,
      Config12,
      Config13,
      Config14,
      Config15,
      Config16,
      Config17,
      Config18,
      Config19,
      Config20,
      Config21,
      Config22,
      Config23,
      Config24,
      Config25,
      Config26,
      Config27,
      Config28,
      Config29,
      Config30,
      Config31,
      Config32,
      Config33,
      Config34,
      Config35,
      Config36,
      Config37,
      Config38,
      Config39,
      Config40,
      Config41,
      Config42,
      Config43,
      Config44,
      Config45,
      Config46,
      Config47,
      Config48,
      Config49,
      Config50,
      Config51,
      Config52,
      Config53,
      Config54,
      Config55,
      Config56,
      Config57,
      Config58,
      Config59,
      Config60,
      (
        imports,
        config01,
        config02,
        config03,
        config04,
        config05,
        config06,
        config07,
        config08,
        config09,
        config10,
        config11,
        config12,
        config13,
        config14,
        config15,
        config16,
        config17,
        config18,
        config19,
        config20,
        config21,
        config22,
        config23,
        config24,
        config25,
        config26,
        config27,
        config28,
        config29,
        config30,
        config31,
        config32,
        config33,
        config34,
        config35,
        config36,
        config37,
        config38,
        config39,
        config40,
        config41,
        config42,
        config43,
        config44,
        config45,
        config46,
        config47,
        config48,
        config49,
        config50,
        config51,
        config52,
        config53,
        config54,
        config55,
        config56,
        config57,
        config58,
        config59,
        config60,
      ) => {
        typeAssert<TypeTest<typeof config01, { prop01: string }>>()
        typeAssert<TypeTest<typeof config60, { prop60: string }>>()

        return {
          imports,
          providers: [{ provide: 'PROPS', useValue: [config01.prop01, config60.prop60] }],
        }
      },
    )

    typeAssert<TypeTest<typeof factory, ExpectedFactoryType<AllProps>>>()

    const module = factory(allProps)

    matchExpectedModuleStructure(module, {
      imports: 120, // Factory pattern with inline config adds the config twice
      providers: [{ provide: 'PROPS', useValue: ['value01', 'value60'] }],
    })
  })
})
