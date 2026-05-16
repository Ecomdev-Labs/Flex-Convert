#ifndef DAVLENIYA_H
#define DAVLENIYA_H

#include <QMainWindow>

QT_BEGIN_NAMESPACE
namespace Ui { class Davleniya; }
QT_END_NAMESPACE

class Davleniya : public QMainWindow
{
    Q_OBJECT

public:
    Davleniya(QWidget *parent = nullptr);
    ~Davleniya();

private slots:
    void on_comboBox_currentIndexChanged(int index);

    void on_pushButton_clicked();

private:
    Ui::Davleniya *ui;
};
#endif // DAVLENIYA_H
