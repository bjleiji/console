import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  ButtonBar,
  history,
  resourceObjPath,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import {
  apiVersionForModel,
  k8sCreate,
  K8sResourceKind,
  referenceFor,
} from '@console/internal/module/k8s';
import { NooBaaObjectBucketModel } from '@console/noobaa-storage-plugin/src/models';
import { getName } from '@console/shared';
import { ActionGroup, Button } from '@patternfly/react-core';
import { commonReducer, defaultState } from './state';

export const CreateOBPage: React.FC = () => {
  const { t } = useTranslation();
  const [state, dispatch] = React.useReducer(commonReducer, defaultState);

  React.useEffect(() => {
    const obj: K8sResourceKind = {
      apiVersion: apiVersionForModel(NooBaaObjectBucketModel),
      kind: NooBaaObjectBucketModel.kind,
      metadata: {
        name: state.name,
      },
      spec: {
        ssl: false,
      },
    };
    if (state.scName) {
      obj.spec.storageClassName = state.scName;
    }
    dispatch({ type: 'setPayload', payload: obj });
  }, [state.name, state.scName]);

  const save = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    dispatch({ type: 'setProgress' });
    k8sCreate(NooBaaObjectBucketModel, state.payload)
      .then((resource) => {
        dispatch({ type: 'unsetProgress' });
        history.push(resourceObjPath(resource, referenceFor(resource)));
      })
      .catch((err) => {
        dispatch({ type: 'setError', message: err.message });
        dispatch({ type: 'unsetProgress' });
      });
  };

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <Helmet>
        <title>{t('noobaa-storage-plugin~Create Object Bucket')}</title>
      </Helmet>
      <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
        <div className="co-m-pane__name">{t('noobaa-storage-plugin~Create Object Bucket')}</div>
        <div className="co-m-pane__heading-link">
          <Link to={`${resourcePathFromModel(NooBaaObjectBucketModel)}~new`} replace>
            {t('noobaa-storage-plugin~Edit YAML')}
          </Link>
        </div>
      </h1>
      <form className="co-m-pane__body-group" onSubmit={save}>
        <div>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="ob-name">
              {t('noobaa-storage-plugin~Object Bucket Name')}
            </label>
            <div className="form-group">
              <input
                className="pf-c-form-control"
                type="text"
                onChange={(e) => {
                  dispatch({ type: 'setName', name: e.currentTarget.value });
                }}
                placeholder={t('noobaa-storage-plugin~my-object-bucket')}
                aria-describedby={t('noobaa-storage-plugin~ob-name-help')}
                id="ob-name"
                name="obName"
                pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
                required
              />
              <p className="help-block" id="ob-name-help">
                {t('noobaa-storage-plugin~If not provided a generic name will be generated.')}
              </p>
            </div>
            <div className="form-group">
              <StorageClassDropdown
                onChange={(sc) => dispatch({ type: 'setStorage', name: getName(sc) })}
                required
                name="storageClass"
              />
              <p className="help-block">
                {t(
                  'noobaa-storage-plugin~Defines the object-store service and the bucket provisioner.',
                )}
              </p>
            </div>
          </div>
        </div>
        <ButtonBar errorMessage={state.error} inProgress={state.progress}>
          <ActionGroup className="pf-c-form">
            <Button type="submit" variant="primary">
              {t('noobaa-storage-plugin~Create')}
            </Button>
            <Button onClick={history.goBack} type="button" variant="secondary">
              {t('noobaa-storage-plugin~Cancel')}
            </Button>
          </ActionGroup>
        </ButtonBar>
      </form>
    </div>
  );
};
